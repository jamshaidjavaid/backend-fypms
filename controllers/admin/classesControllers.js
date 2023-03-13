const mongoose = require("mongoose");
const sourceDB = mongoose.createConnection(
  "mongodb+srv://jamshaidjavaid:rollcasting@cluster0.hfeosn9.mongodb.net/externaledatabase?retryWrites=true&w=majority"
);

const sourceStudentsCollection = sourceDB.collection("students");
const sourceClassesCollection = sourceDB.collection("classes");

const { validationResult } = require("express-validator");

const HttpError = require("../../models/HttpError");
const Class = require("../../models/classModel");
const Student = require("../../models/studentModel");
const Teacher = require("../../models/teacherModel").default;
const Project = require("../../models/projectModel");
const NoticeBoard = require("../../models/noticeBoardModel");

// ///////////////////////////////////////////////////////////////////////////////////////////
// get all the classes
const getClasses = async (req, res, next) => {
  let classes;
  try {
    classes = await Class.find({});
  } catch (err) {
    console.error(err);

    if (classes.length === 0) {
      return next(new HttpError("No class exist", 404));
    }

    return next(new HttpError("Sorry, couldn't load your classes", 500));
  }

  res.json({ classes: classes.map((n) => n.toObject({ getters: true })) });
};

// create a new class
const createClass = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { program, session, shift, minAllowed, maxAllowed } = req.body;

  const classname = `${program}-${shift}-${session}`;

  try {
    const existingClass = await Class.findOne({ name: classname });
    if (existingClass) {
      return next(new HttpError("Classname already exists.", 422));
    }

    // Find the source class
    const sourceClass = await sourceClassesCollection.findOne({
      name: classname,
    });
    if (!sourceClass) {
      return next(
        new HttpError("Source class not found, so can't be created", 404)
      );
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();

    // Create the class in our database
    const createdClass = new Class({
      name: classname,
      program,
      session,
      shift,
      minAllowed,
      maxAllowed,
    });

    // Get students from the source database and add them to our database
    let classStudents = [];
    for await (const student of sourceStudentsCollection.find({
      className: classname,
    })) {
      const newStudent = new Student({
        name: student.name,
        rollNo: student.rollNo,
        classId: createdClass._id,
        image: student.image,
        cgpa: student.cgpa,
      });
      await newStudent.save({ session: sess });
      ++createdClass.totalStudents;
      classStudents.push(newStudent);
    }

    await createdClass.save({ session: sess });
    try {
      const topStudents = classStudents
        .filter((student) => student.classId === createdClass._id)
        .sort((a, b) => b.cgpa - a.cgpa)
        .slice(0, Math.ceil(classStudents.length / maxAllowed));

      if (topStudents.length === 0) {
        await sess.abortTransaction();
        sess.endSession();
        return next(new HttpError("Top students were not found", 404));
      }

      for (const student of topStudents) {
        student.hasTopped = true;
        await student.save({ session: sess });
      }
    } catch (err) {
      await sess.abortTransaction();
      sess.endSession();
      console.error(err);
      return next(
        new HttpError("Couldn't get top students, please try again later", 500)
      );
    }
    await sess.commitTransaction();
    sess.endSession();
    res.status(201).json({
      createdClass,
      message: "Class and Students Saved Successfully",
    });
  } catch (err) {
    await sess.abortTransaction();
    sess.endSession();
    console.error(err);
    return next(new HttpError("Error occurred while creating class.", 500));
  }
};

// delete a created class
const deleteClass = async (req, res, next) => {
  const { classId } = req.params;
  let myClass;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    myClass = await Class.findOneAndDelete({ _id: classId }, { session: sess });
    await Student.deleteMany({ classId: myClass._id }, { session: sess });
    await sess.commitTransaction();
    sess.endSession();
  } catch (err) {
    await sess.abortTransaction();
    sess.endSession();
    console.error(err);
    return next(
      new HttpError("Something went wrong, couldn't delete the class", 422)
    );
  }
  res.json({ myClass, message: "Deleted Successfully" });
};

// IMPORTANT
// WILL BE USED FOR PRINTING THE CLASS PAGE

const getClassById = async (req, res, next) => {
  const { classId } = req.params;

  const myClass = await Class.findById(classId);

  if (!myClass) {
    return next(new HttpError("Your chosen class doesn't exist", 404));
  }

  let projects, supervisors, examiners, students, notices, timetable;

  try {
    projects = await Project.find({ classId: classId });
    supervisors = await Teacher.find({
      assignedClassesForSupervision: { $in: classId },
    });
    examiners = await Teacher.find({
      assignedClassesForExamination: { $in: classId },
    });
    students = await Student.find({ classId: classId });
    notices = await NoticeBoard.find({
      receiverEntity: "class",
      receiverId: classId,
    });
    timetable = myClass.timetable;
  } catch (err) {
    console.error(err);
    return next(
      new HttpError("Something went wrong, couldn't load class", 500)
    );
  }
  res.json({
    myClass,
    projects,
    supervisors,
    examiners,
    students,
    notices,
    timetable,
  });
};

const editTimeTable = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { classId } = req.params;

  const {
    titleSubmission,
    proposalSubmission,
    proposalDefense,
    deliverable1,
    deliverable1Evalutaion,
    deliverable2,
    deliverable2Evalutaion,
  } = req.body;

  let updatedClass;

  try {
    updatedClass = await Class.findByIdAndUpdate(
      classId,
      {
        timetable: {
          titleSubmission,
          proposalSubmission,
          proposalDefense,
          deliverable1,
          deliverable1Evalutaion,
          deliverable2,
          deliverable2Evalutaion,
        },
      },
      { runValidators: true, new: true }
    );
    res.json({ updatedClass, message: "timetable has been updated" });
  } catch (err) {
    console.error(err);
    return next(
      new HttpError("Something went wrong, or maybe class doesn't exists", 500)
    );
  }
};

// ASSIGNING A TEACHER TO CLASS AS SUPERVISOR

const assignSupervisorToClass = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { classId } = req.params;
  const { teacherId } = req.body;

  const sess = await mongoose.startSession();
  sess.startTransaction();

  try {
    // Check if class exists or not. check with classId
    const foundClass = await Class.findById(classId);
    if (!foundClass) {
      return next(new HttpError("Class not found", 404));
    }

    // Check if teacher exists or not. check with teacherId, with findById method.
    const foundTeacher = await Teacher.findById(teacherId);
    if (!foundTeacher) {
      return next(new HttpError("Teacher not found", 404));
    }

    // then check in the assignedClassesForSupervision of Teacher that wether classId is already in the array or not.
    if (foundTeacher.assignedClassesForSupervision.includes(classId)) {
      return next(
        new HttpError(
          "Class already assigned to the teacher for supervision",
          400
        )
      );
    }

    // then push the classId into the assignedClassesForSupervision array of Teacher we get
    foundTeacher.assignedClassesForSupervision.push(classId);
    await foundTeacher.save({ session: sess });
    foundClass.assignedSupervisors += 1;
    await foundClass.save({ session: sess });

    await sess.commitTransaction();
    sess.endSession();
    res.json({ message: "Class assigned to a supervisor" });
  } catch (err) {
    await sess.abortTransaction();
    sess.endSession();
    console.log(err);
    return next(new HttpError("Internal server error", 500));
  }
};

// ASSIGNING EXAMINER TO CLASS

const assignExaminerToClass = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { classId } = req.params;
  const { teacherId } = req.body;

  const sess = await mongoose.startSession();
  sess.startTransaction();

  try {
    // Check if class exists or not. check with classId
    const foundClass = await Class.findById(classId);
    if (!foundClass) {
      return next(new HttpError("Class not found", 404));
    }

    // Check if teacher exists or not. check with teacherId, with findById method.
    const foundTeacher = await Teacher.findById(teacherId);
    if (!foundTeacher) {
      return next(new HttpError("Teacher not found", 404));
    }

    // then check in the assignedClassesForExamination of Teacher that wether classId is already in the array or not.
    if (foundTeacher.assignedClassesForExamination.includes(classId)) {
      return next(
        new HttpError(
          "Class already assigned to the teacher for examination",
          400
        )
      );
    }

    // then push the classId into the assignedClassesForExamination array of Teacher we get
    foundTeacher.assignedClassesForExamination.push(classId);
    await foundTeacher.save({ session: sess });
    foundClass.assignedExaminers += 1;
    await foundClass.save({ session: sess });

    await sess.commitTransaction();
    sess.endSession();
    res.json({ message: "Class assigned to a examiner" });
  } catch (err) {
    await sess.abortTransaction();
    sess.endSession();
    console.log(err);
    return next(new HttpError("Internal server error", 500));
  }
};

module.exports = {
  getClasses,
  createClass,
  deleteClass,
  getClassById,
  editTimeTable,
  assignSupervisorToClass,
  assignExaminerToClass,
};

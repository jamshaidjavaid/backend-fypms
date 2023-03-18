const HttpError = require("../../models/HttpError");
const Class = require("../../models/classModel");
const Student = require("../../models/studentModel");
const Teacher = require("../../models/teacherModel");
const Project = require("../../models/projectModel");
const NoticeBoard = require("../../models/noticeBoardModel");

const getProjectFormData = async (req, res, next) => {
  const { classId, all } = req.query;
  let students, myClass, supervisors;
  try {
    if (all) {
      students = await Student.find({ classId: classId }, "name");
    } else {
      students = await Student.find(
        { classId: classId, assignedProjectId: null },
        "name"
      );
    }
    myClass = await Class.findById(classId, "name maxAllowed minAllowed");
    supervisors = await Teacher.find(
      { assignedClassesForSupervision: myClass._id },
      "name"
    );
    res.json({
      class: myClass.toObject({ getters: true }),
      students: students.map((s) => s.toObject({ getters: true })),
      supervisors: supervisors.map((s) => s.toObject({ getters: true })),
    });
  } catch (err) {
    console.error(err);
    return next(new HttpError("Sorry, couldn't load your data", 500));
  }
};

const loadAddSupervisorData = async (req, res, next) => {
  const { classId } = req.query;
  let supervisors, teachers;
  try {
    teachers = await Teacher.find({}, "name");
    supervisors = await Teacher.find(
      { assignedClassesForSupervision: classId },
      "name"
    );
    res.json({
      teachers: teachers.map((s) => s.toObject({ getters: true })),
      supervisors: supervisors.map((s) => s.toObject({ getters: true })),
    });
  } catch (err) {
    console.error(err);
    return next(new HttpError("Sorry, couldn't load your data", 500));
  }
};

module.exports = { getProjectFormData, loadAddSupervisorData };

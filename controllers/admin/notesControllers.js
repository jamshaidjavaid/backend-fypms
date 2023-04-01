const mongoose = require("mongoose");

const HttpError = require("../../models/HttpError");
const Teacher = require("../../models/teacherModel");
const Student = require("../../models/studentModel");
const Note = require("../../models/noteModel");

const getNotes = async (req, res, next) => {
  const { role, userId } = req.query;
  let notes;
  try {
    if (role === "Admin") {
      notes = await Note.find().sort({ createdAt: -1 });
    } else if (role === "Student") {
      const student = await Student.findById(userId);
      notes = student.notes;
    } else if (role === "Teacher") {
      const teacher = await Teacher.findById(userId);
      notes = teacher.notes;
    }
    res.json({ notes: notes.map((n) => n.toObject({ getters: true })) });
  } catch (err) {
    console.error(err);
    return next(
      new HttpError("Something went wrong, couldn't find notes", 500)
    );
  }
};

// CREATING A NOte
const createNote = async (req, res, next) => {
  const { note, userId, role } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (role === "Student") {
      const student = await Student.findById(userId);
      if (!student) {
        return next(new HttpError("This student doesn't exist", 404));
      }
      const createdNote = {
        note,
      };
      student.notes.push(createdNote);
      await student.save({ session });
    } else if (role === "Teacher") {
      const teacher = await Teacher.findById(userId);
      if (!teacher) {
        return next(new HttpError("This teacher doesn't exist", 404));
      }
      const createdNote = {
        note,
      };
      teacher.notes.push(createdNote);
      await teacher.save({ session });
    } else if (role === "Admin") {
      const createdNote = new Note({
        note,
      });
      await createdNote.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    res.json({
      message: "Saved Successfully",
    });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    session.endSession();
    return next(
      new HttpError("Something went wrong, couldn't save the note", 500)
    );
  }
};

//  delete A NOte
const deleteNote = async (req, res, next) => {
  const { userId, role } = req.query;
  const { noteId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (role === "Student") {
      await Student.updateOne(
        { _id: userId },
        { $pull: { notes: { _id: noteId } } },
        { session }
      );
    } else if (role === "Teacher") {
      await Teacher.updateOne(
        { _id: userId },
        { $pull: { notes: { _id: noteId } } },
        { session }
      );
    } else if (role === "Admin") {
      await Note.findByIdAndDelete(noteId, { session });
    }

    await session.commitTransaction();
    session.endSession();
    res.json({
      message: "Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    session.endSession();
    return next(
      new HttpError("Something went wrong, couldn't save the note", 500)
    );
  }
};

module.exports = {
  getNotes,
  createNote,
  deleteNote,
};

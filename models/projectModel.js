const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 255,
  },
  memberNames: [
    {
      name: {
        type: String,
        required: true,
        maxlength: 255,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        unique: true,
      },
    },
  ],
  members: {
    type: Number,
    min: 1,
  },
  supervisorName: {
    type: String,
    required: true,
    maxlength: 255,
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  className: {
    type: String,
    required: true,
    maxlength: 255,
  },
  status: {
    type: String,
    enum: ["in_progress", "completed", "passed", "failed"],
    default: "in_progress",
  },
  submissions: [
    {
      type: String,
      maxlength: 255,
    },
  ],
  description: {
    type: String,
    default: "",
  },
});

projectSchema.path("memberNames").set(function (memberNames) {
  this.members = memberNames.length;
  return memberNames;
});

module.exports = mongoose.model("Project", projectSchema);

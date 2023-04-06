const HttpError = require("../../models/HttpError");
const NoticeBoard = require("../../models/noticeBoardModel");
const Notification = require("../../models/notificationModel");
const Teacher = require("../../models/teacherModel");
const Class = require("../../models/classModel");

const getDashboard = async (req, res, next) => {
  const { userId } = req.query;
  let notifications = [],
    notices = [],
    classesSupervision = 0,
    classesExamination = 0,
    projectsSupervision = 0,
    projectsExamination = 0,
    projectsSupervisionLimit = 0;

  try {
    const teacher = await Teacher.findById(userId);

    if (!teacher) {
      return next(new HttpError("Couldn't find teacher", 401));
    }

    classesExamination = teacher.assignedClassesForExamination.length;
    classesSupervision = teacher.assignedClassesForSupervision.length;
    projectsSupervision = teacher.assignedProjectsCount;
    projectsSupervisionLimit = teacher.projectsLimit;

    for (const aClass of teacher.assignedClassesForExamination) {
      const myClassProjects = await Class.findById(aClass, "totalProjects");
      projectsExamination += myClassProjects;
    }

    notifications = await Notification.find({
      senderId: userId,
    });
    notices = await NoticeBoard.find({
      receiverEntity: "teacher",
      receiverId: userId,
    });

    res.send({
      notices: notices.map((n) => n.toObject({ getters: true })),
      notifications: notifications.map((n) => n.toObject({ getters: true })),
      classesExamination,
      classesSupervision,
      projectsSupervision,
      projectsSupervisionLimit,
      projectsExamination,
    });
  } catch (err) {
    console.error(err);
    return next(new HttpError("Couldn't retrieve dashboard data", 500));
  }
};

const updateLimit = async (req, res, next) => {
  const { userId, limit } = req.body;

  try {
    const teacher = await Teacher.findById(userId);

    if (!teacher) {
      return next(new HttpError("Couldn't find teacher", 401));
    }

    if (teacher.assignedProjectsCount > limit) {
      return next(
        new HttpError(
          "Can't assign new limit when projects assigned already more",
          401
        )
      );
    }

    teacher.projectsLimit = limit;
    await teacher.save();

    res.send({
      message: "Projects Limit Updated",
    });
  } catch (err) {
    console.error(err);
    return next(new HttpError("Couldn't retrieve dashboard data", 500));
  }
};

module.exports = {
  getDashboard,
  updateLimit,
};

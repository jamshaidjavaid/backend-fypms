const express = require("express");
const { body } = require("express-validator");

const { getDashboard } = require("../controllers/admin/dashboardController");
const {
  getProjectFormData,
  loadAddSupervisorData,
} = require("../controllers/admin/formControllers");
// CLASSES
const {
  getClasses,
  createClass,
  getClassById,
  editTimeTable,
  assignSupervisorToClass,
  assignExaminerToClass,
  deleteClass,
} = require("../controllers/admin/classesControllers");

// NOTIFICATIONS
const {
  getNotifications,
  createNotification,
  deleteNotification,
} = require("../controllers/admin/notificationsControllers");

// NOTICES
const {
  createNotice,
  getNoticeBoard,
  deleteNotice,
} = require("../controllers/admin/noticeBoardControllers");

// TEACHERS
const {
  getTeachers,
  getTeacherById,
  unAssignSupervisorToClass,
  unAssignExaminerToClass,
} = require("../controllers/admin/teachersControllers");

// PROJECTS
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/admin/projectsControllers");

// PERSONAL NOTES
const {
  getNotes,
  createNote,
  deleteNote,
} = require("../controllers/admin/notesControllers");

// ///////////////////////////////////////////////////////////////////////////////////
const router = express.Router();

router.get("/", getDashboard);

// Notice Board Routes
router.get("/notice-board", getNoticeBoard);
router.post(
  "/notice-board/new-notice",
  [
    body("headline").notEmpty().withMessage("Write Headline"),
    body("description").notEmpty().withMessage("Write description"),
    body("receiverEntity")
      .isIn(["class", "teacher"])
      .withMessage("Invalid reciever entity"),
    body("receiverId")
      .notEmpty()
      .exists({ checkFalsy: true })
      .withMessage("Invalid reciever id"),
  ],
  createNotice
);
router.delete("/notice-board/:noticeId/delete", deleteNotice);

// Notification Routes
router.get("/notifications", getNotifications);
router.post("/notifications/new-notification", createNotification);
router.delete("/notifications/:notificationId/delete", deleteNotification);

// Classes Routes
router.get("/classes", getClasses);
router.post(
  "/classes/new-class",
  [
    body("program").notEmpty().withMessage("Write program"),
    body("session").notEmpty().withMessage("choose session"),
    body("shift").notEmpty().withMessage("choose shift"),
    body("minAllowed").notEmpty().withMessage("choose minAllowed"),
    body("maxAllowed").notEmpty().withMessage("choose maxAllowed"),
  ],
  createClass
);
router.delete("/classes/:classId/delete", deleteClass);
router.get("/classes/:classId", getClassById);
router.patch(
  "/classes/:classId/edit-timetable",
  [
    body("titleSubmission").notEmpty().isDate().withMessage("choose date"),
    body("proposalSubmission").notEmpty().isDate().withMessage("choose date"),
    body("proposalDefense").notEmpty().isDate().withMessage("choose date"),
    body("deliverable1").notEmpty().isDate().withMessage("choose date"),
    body("deliverable1Evalutaion")
      .notEmpty()
      .isDate()
      .withMessage("choose date"),
    body("deliverable2").notEmpty().isDate().withMessage("choose date"),
    body("deliverable2Evalutaion")
      .notEmpty()
      .isDate()
      .withMessage("choose date"),
  ],
  editTimeTable
);
router.patch("/classes/:classId/assign-supervisor", assignSupervisorToClass);
router.patch("/classes/:classId/assign-examiner", assignExaminerToClass);

// PROJECTS ROUTES
router.get("/projects", getAllProjects);
router.post(
  "/projects/new-project",
  [
    body("title").notEmpty().withMessage("Write title"),
    body("memberNames").notEmpty().isArray().withMessage("choose memberNames"),
    body("supervisorName").notEmpty().withMessage("choose supervisor"),
    body("supervisorId").notEmpty().withMessage("choose supervisor id"),
    body("classId").notEmpty().withMessage("choose class id"),
    body("className").notEmpty().withMessage("choose class id"),
  ],
  createProject
);
router.get("/projects/:projectId", getProjectById);
router.delete("/projects/:projectId/delete", deleteProject);
router.patch("/projects/:projectId/edit", updateProject);

// TEACHERS ROUTES
router.get("/teachers", getTeachers);
router.get("/teachers/:teacherId", getTeacherById);
router.patch(
  "/teachers/:teacherId/unassign-supervisor",
  [body("classId").notEmpty().withMessage("choose class Id")],
  unAssignSupervisorToClass
);
router.patch(
  "/teachers/:teacherId/unassign-examiner",
  [body("classId").notEmpty().withMessage("choose class Id")],
  unAssignExaminerToClass
);

// NOTES ROUTES
router.get("/personal-notes", getNotes);
router.post("/personal-notes/new-note", createNote);
router.delete("/personal-notes/:noteId/delete", deleteNote);

// FORM ROUTES
router.get("/forms/new-project/data", getProjectFormData);
router.get("/forms/add-supervisor/data", loadAddSupervisorData);

module.exports = router;

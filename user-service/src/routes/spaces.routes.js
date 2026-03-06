const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRoles, ROLES } = require("../middleware/role.middleware");
const {
  getSpaces,
  addSpacesColumn,
  createSpacesTask,
  updateSpacesTask,
  addSpacesComment,
  updateSpacesComment,
  deleteSpacesComment,
  deleteSpacesTask,
} = require("../controllers/spaces.controller");

const router = express.Router();

// Get tasks + columns (employees see only their own tasks)
router.get(
  "/",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  getSpaces
);

// Add a new custom column (admin / team lead / super admin)
router.post(
  "/columns",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD),
  addSpacesColumn
);

// Create a task
router.post(
  "/tasks",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  createSpacesTask
);

// Update a task
router.patch(
  "/tasks/:taskId",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  updateSpacesTask
);

// Add comment
router.post(
  "/tasks/:taskId/comments",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  addSpacesComment
);

// Update comment
router.patch(
  "/tasks/:taskId/comments/:commentId",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  updateSpacesComment
);

// Delete comment
router.delete(
  "/tasks/:taskId/comments/:commentId",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  deleteSpacesComment
);

// Delete task (only creator, or SUPER_ADMIN)
router.delete(
  "/tasks/:taskId",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  deleteSpacesTask
);

module.exports = router;


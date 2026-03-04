const express = require("express");
const {
  upsertProjectCharter,
  getProjectCharter,
  listProjectCharters,
  getAssignedProjects,
  deleteProjectCharter,
} = require("../controllers/projectCharter.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRoles, ROLES } = require("../middleware/role.middleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  // Allow employees to update project charters (for task status/messages),
  // while admins and leads can also create/update.
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  upsertProjectCharter
);

router.get(
  "/",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD),
  listProjectCharters
);

router.get(
  "/assigned/:empId",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  getAssignedProjects
);

router.get(
  "/:projectId",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  getProjectCharter
);

router.delete(
  "/:projectId",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD),
  deleteProjectCharter
);

module.exports = router;

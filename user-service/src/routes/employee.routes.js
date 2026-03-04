const express = require("express");
const { createEmployee, listEmployees } = require("../controllers/employee.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRoles, ROLES } = require("../middleware/role.middleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD),
  createEmployee
);

router.get(
  "/",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  listEmployees
);

module.exports = router;

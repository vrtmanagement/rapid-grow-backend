const express = require("express");
const {
  createEmployee,
  listEmployees,
  loginEmployee,
} = require("../controllers/employee.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRoles, ROLES } = require("../middleware/role.middleware");

const router = express.Router();

// Employee creation with RBAC:
// - SUPER_ADMIN: can create ADMIN, TEAM_LEAD, EMPLOYEE
// - ADMIN: can create TEAM_LEAD, EMPLOYEE
// - TEAM_LEAD: can create EMPLOYEE
// - EMPLOYEE: cannot create anyone
router.post(
  "/",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD),
  createEmployee
);

// List employees - keep protected but allow ADMIN-level visibility
router.get(
  "/",
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.EMPLOYEE),
  listEmployees
);

// Login remains public
router.post("/login", loginEmployee);

module.exports = router;


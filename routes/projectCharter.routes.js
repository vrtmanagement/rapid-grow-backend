const express = require("express");
const {
  upsertProjectCharter,
  getProjectCharter,
  listProjectCharters,
  getAssignedProjects,
  deleteProjectCharter,
} = require("../controllers/projectCharter.controller");

const router = express.Router();

// Save or update a project charter (from frontend workspace project)
router.post("/", upsertProjectCharter);

// List all project charters
router.get("/", listProjectCharters);

// Get projects assigned to an employee (must be before :projectId)
router.get("/assigned/:empId", getAssignedProjects);

// Get one by client project id (e.g. p-1, p-123)
router.get("/:projectId", getProjectCharter);

// Delete a project charter by client project id
router.delete("/:projectId", deleteProjectCharter);

module.exports = router;


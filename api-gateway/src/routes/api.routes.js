const express = require("express");
const { proxyLogin } = require("../proxy/auth.proxy");
const { proxyToUserService } = require("../proxy/user.proxy");

const router = express.Router();

router.use(express.json());

// Auth: POST /api/employees/login -> auth-service /login
router.post("/employees/login", proxyLogin);

// User: /api/employees -> user-service /employees
router.all("/employees", (req, res) => proxyToUserService(req, res, "/employees"));

// User: /api/project-charters -> user-service /project-charters
router.all("/project-charters", (req, res) =>
  proxyToUserService(req, res, "/project-charters")
);

// User: /api/project-charters/assigned/:empId (must be before :projectId)
router.get("/project-charters/assigned/:empId", (req, res) =>
  proxyToUserService(req, res, `/project-charters/assigned/${req.params.empId}`)
);

// User: /api/project-charters/:projectId
router.all("/project-charters/:projectId", (req, res) =>
  proxyToUserService(req, res, `/project-charters/${req.params.projectId}`)
);

module.exports = router;

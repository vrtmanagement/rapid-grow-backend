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

// User: /api/spaces -> user-service /spaces
router.all("/spaces", (req, res) => proxyToUserService(req, res, "/spaces"));

// User: /api/spaces/columns -> user-service /spaces/columns
router.all("/spaces/columns", (req, res) =>
  proxyToUserService(req, res, "/spaces/columns")
);

// User: /api/spaces/tasks -> user-service /spaces/tasks
router.all("/spaces/tasks", (req, res) =>
  proxyToUserService(req, res, "/spaces/tasks")
);

// User: /api/spaces/tasks/:taskId -> user-service /spaces/tasks/:taskId
router.all("/spaces/tasks/:taskId", (req, res) =>
  proxyToUserService(req, res, `/spaces/tasks/${req.params.taskId}`)
);

// User: /api/spaces/tasks/:taskId/comments -> user-service /spaces/tasks/:taskId/comments
router.all("/spaces/tasks/:taskId/comments", (req, res) =>
  proxyToUserService(
    req,
    res,
    `/spaces/tasks/${req.params.taskId}/comments`
  )
);

// User: /api/spaces/tasks/:taskId/comments/:commentId
router.all("/spaces/tasks/:taskId/comments/:commentId", (req, res) =>
  proxyToUserService(
    req,
    res,
    `/spaces/tasks/${req.params.taskId}/comments/${req.params.commentId}`
  )
);

module.exports = router;

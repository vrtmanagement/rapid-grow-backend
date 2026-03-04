const express = require("express");
const { login, health } = require("../controllers/auth.controller");

const router = express.Router();

router.get("/health", health);
router.post("/login", login);

module.exports = router;

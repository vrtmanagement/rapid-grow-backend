const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = {
  PORT: process.env.PORT || 5000,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:5001",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:5002",
};

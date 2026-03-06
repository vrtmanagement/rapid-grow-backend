const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");

// Load environment variables from root .env by default
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Reuse existing Swagger definition from api-gateway
const swaggerDocument = require("../api-gateway/src/swagger");

// Reuse existing route modules from auth-service and user-service
const authRoutes = require("../auth-service/src/routes/auth.routes");
const employeeRoutes = require("../user-service/src/routes/employee.routes");
const projectCharterRoutes = require("../user-service/src/routes/projectCharter.routes");
const spacesRoutes = require("../user-service/src/routes/spaces.routes");
const { login } = require("../auth-service/src/controllers/auth.controller");

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Database connection (shared across all features)
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.warn(
    "Warning: MONGO_URI is not set. The unified backend will not be able to connect to MongoDB."
  );
} else {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("Unified Backend: Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Unified Backend: MongoDB connection error:", err);
    });
}

// Root and health endpoints
app.get("/", (_req, res) => {
  res.send("Rapid Grow Unified Backend - use /api/* for routes");
});

app.get("/health", (_req, res) => {
  res.json({ service: "unified-backend", status: "ok" });
});

// Swagger UI (same docs as the original API Gateway)
// Use separate middleware so that:
// - GET /api/docs -> HTML page
// - /api/docs/*   -> static assets (JS, CSS)
app.use("/api/docs", swaggerUi.serve);
app.get("/api/docs", swaggerUi.setup(swaggerDocument));

// Auth: keep compatibility with existing frontend
// Old flow: POST /api/employees/login -> auth-service /login
app.post("/api/employees/login", login);

// Also expose auth routes under /api/auth for clarity (optional)
app.use("/api/auth", authRoutes);

// User-service routes (employees and project charters)
app.use("/api/employees", employeeRoutes);
app.use("/api/project-charters", projectCharterRoutes);
app.use("/api/spaces", spacesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;


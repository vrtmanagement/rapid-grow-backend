const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const projectCharterRoutes = require("./routes/projectCharter.routes");
const employeeRoutes = require("./routes/employee.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

// Basic Swagger setup
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Rapid Grow API",
    version: "1.0.0",
    description: "Backend API for admin and employee portals with RBAC.",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/employees/login": {
      post: {
        summary: "Employee login",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  empId: { type: "string" },
                  password: { type: "string" },
                },
                required: ["empId", "password"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful, returns JWT and employee info",
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/employees": {
      post: {
        summary: "Create employee (RBAC protected)",
        tags: ["Employees"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  empId: { type: "string" },
                  empName: { type: "string" },
                  designation: { type: "string" },
                  department: { type: "string" },
                  password: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  status: { type: "string" },
                  role: {
                    type: "string",
                    enum: [
                      "SUPER_ADMIN",
                      "ADMIN",
                      "TEAM_LEAD",
                      "EMPLOYEE",
                    ],
                  },
                },
                required: [
                  "empId",
                  "empName",
                  "designation",
                  "department",
                  "password",
                ],
              },
            },
          },
        },
        responses: {
          201: { description: "Employee created" },
          400: { description: "Validation error" },
          401: { description: "Authentication required" },
          403: { description: "Forbidden for this role" },
        },
      },
      get: {
        summary: "List employees (RBAC protected)",
        tags: ["Employees"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of employees" },
          401: { description: "Authentication required" },
        },
      },
    },
  },
};

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API working properly" });
});

app.use("/api/project-charters", projectCharterRoutes);
app.use("/api/employees", employeeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const employeeRoutes = require("./routes/employee.routes");
const projectCharterRoutes = require("./routes/projectCharter.routes");

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("User Service: Connected to MongoDB"))
  .catch((err) => console.error("User Service: MongoDB error", err));

app.get("/health", (_req, res) => {
  res.json({ service: "user-service", status: "ok" });
});

app.use("/employees", employeeRoutes);
app.use("/project-charters", projectCharterRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`User Service: http://localhost:${PORT} (Swagger via Gateway: http://localhost:5000/api/docs)`);
});

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const Employee = require("../models/Employee.model");
const jwt = require("jsonwebtoken");
const { ROLES } = require("../config/roles");

const login = async (req, res) => {
  try {
    const { empId, password } = req.body;

    if (!empId || !password) {
      return res
        .status(400)
        .json({ message: "empId and password are required" });
    }

    const employee = await Employee.findOne({ empId, status: "active" });
    if (!employee) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { password: _, ...employeeObj } = employee.toObject();

    const payload = {
      sub: employee._id.toString(),
      empId: employee.empId,
      email: employee.email,
      role: employee.role || ROLES.EMPLOYEE,
      name: employee.empName,
    };

    const secret = process.env.JWT_SECRET || "fallback-secret-change-me";
    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    return res.json({
      success: true,
      token,
      employee: employeeObj,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ message: "Login failed", error: err.message });
  }
};

const health = (_req, res) => {
  res.json({ service: "auth-service", status: "ok" });
};

module.exports = {
  login,
  health,
};

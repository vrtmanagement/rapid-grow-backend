const Employee = require("../models/employee.model");
const jwt = require("jsonwebtoken");
const { canCreateRole, ROLES } = require("../middleware/role.middleware");

const createEmployee = async (req, res) => {
  try {
    const {
      empId,
      empName,
      designation,
      department,
      password,
      role,
      email,
      phone,
      status,
    } = req.body;

    if (!empId || !empName || !designation || !department || !password) {
      return res.status(400).json({
        message:
          "Missing required fields: empId, empName, designation, department, password",
      });
    }

    const existing = await Employee.findOne({ empId });
    if (existing) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    const creator = req.user;

    // When creator exists (i.e. not coming from seed script), enforce RBAC rules
    let targetRole = role || ROLES.EMPLOYEE;
    if (!Object.values(ROLES).includes(targetRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (creator) {
      if (!canCreateRole(creator.role, targetRole)) {
        return res.status(403).json({
          message: `Role ${creator.role} is not allowed to create ${targetRole}`,
        });
      }
    }

    const employee = new Employee({
      empId: empId.trim(),
      empName: empName.trim(),
      designation: designation.trim(),
      department: department.trim(),
      password,
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      status: status || "active",
      role: targetRole,
      createdBy: creator ? creator.id : undefined,
    });

    await employee.save();

    // Return without password
    const { password: _, ...employeeObj } = employee.toObject();
    return res.status(201).json(employeeObj);
  } catch (err) {
    console.error("Error creating employee", err);
    return res
      .status(500)
      .json({ message: "Failed to create employee", error: err.message });
  }
};

const listEmployees = async (_req, res) => {
  try {
    const employees = await Employee.find({ status: "active" })
      .select("-password")
      .sort({ empName: 1 });
    return res.json(employees);
  } catch (err) {
    console.error("Error listing employees", err);
    return res
      .status(500)
      .json({ message: "Failed to list employees", error: err.message });
  }
};

const loginEmployee = async (req, res) => {
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

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    return res.json({
      success: true,
      token,
      employee: employeeObj,
    });
  } catch (err) {
    console.error("Error logging in employee", err);
    return res
      .status(500)
      .json({ message: "Login failed", error: err.message });
  }
};

module.exports = {
  createEmployee,
  listEmployees,
  loginEmployee,
};

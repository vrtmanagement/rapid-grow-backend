const Employee = require("../models/Employee.model");
const { canCreateRole, ROLES } = require("../config/roles");

async function computeAdminGroupEmpIds(viewer) {
  if (!viewer?.empId) return null;
  const self = await Employee.findOne({ empId: viewer.empId })
    .select("_id empId role createdBy")
    .lean();
  if (!self) return null;

  // Walk up to root admin (SUPER_ADMIN / ADMIN)
  let root = self;
  const visited = new Set();
  while (root.createdBy) {
    const key = String(root.createdBy);
    if (visited.has(key)) break;
    visited.add(key);
    const parent = await Employee.findById(root.createdBy)
      .select("_id empId role createdBy")
      .lean();
    if (!parent) break;
    root = parent;
  }
  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(root.role)) {
    root = self;
  }

  const allowedEmpIds = new Set();
  const queue = [root._id];
  const seen = new Set(queue.map((id) => String(id)));
  if (root.empId) {
    allowedEmpIds.add(root.empId);
  }

  while (queue.length) {
    const currentIds = queue.splice(0, queue.length);
    const children = await Employee.find({ createdBy: { $in: currentIds } })
      .select("_id empId")
      .lean();
    for (const child of children) {
      const idStr = String(child._id);
      if (seen.has(idStr)) continue;
      seen.add(idStr);
      queue.push(child._id);
      if (child.empId) {
        allowedEmpIds.add(child.empId);
      }
    }
  }

  return Array.from(allowedEmpIds);
}

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
    let targetRole = role || ROLES.EMPLOYEE;
    if (!Object.values(ROLES).includes(targetRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (creator && !canCreateRole(creator.role, targetRole)) {
      return res.status(403).json({
        message: `Role ${creator.role} is not allowed to create ${targetRole}`,
      });
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
      createdBy: creator?.id,
    });

    await employee.save();
    const { password: _, ...employeeObj } = employee.toObject();
    return res.status(201).json(employeeObj);
  } catch (err) {
    console.error("Create employee error:", err);
    return res
      .status(500)
      .json({ message: "Failed to create employee", error: err.message });
  }
};

const listEmployees = async (req, res) => {
  try {
    const viewer = req.user;

    // Super admin can see everyone
    if (viewer?.role === ROLES.SUPER_ADMIN) {
      const employees = await Employee.find({ status: "active" })
        .select("-password")
        .sort({ empName: 1 });
      return res.json(employees);
    }

    const allowedEmpIds = await computeAdminGroupEmpIds(viewer);
    if (!allowedEmpIds || allowedEmpIds.length === 0) {
      return res.json([]);
    }

    const employees = await Employee.find({
      status: "active",
      empId: { $in: allowedEmpIds },
    })
      .select("-password")
      .sort({ empName: 1 });

    return res.json(employees);
  } catch (err) {
    console.error("List employees error:", err);
    return res
      .status(500)
      .json({ message: "Failed to list employees", error: err.message });
  }
};

module.exports = {
  createEmployee,
  listEmployees,
};

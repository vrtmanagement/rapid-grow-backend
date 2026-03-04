const ProjectCharter = require("../models/ProjectCharter.model");
const Employee = require("../models/Employee.model");
const { ROLES } = require("../config/roles");

async function computeAdminGroupEmpIds(viewer) {
  if (!viewer?.empId) return null;
  const self = await Employee.findOne({ empId: viewer.empId })
    .select("_id empId role createdBy")
    .lean();
  if (!self) return null;

  // Find root admin (top-level SUPER_ADMIN or ADMIN in the chain)
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

  // If root is not an admin-type, treat current user as root
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

const upsertProjectCharter = async (req, res) => {
  try {
    const {
      id,
      name,
      status,
      dateCreated,
      businessCase,
      problemStatement,
      goalStatement,
      inScope,
      outOfScope,
      benefits,
      champion,
      championRole,
      lead,
      leadRole,
      smeList,
      projectTeam,
      phases,
      tasks,
    } = req.body;

    if (!id || !name) {
      return res
        .status(400)
        .json({ message: "Missing required fields: id and name" });
    }

    const payload = {
      clientProjectId: id,
      name,
      status,
      dateCreated,
      businessCase,
      problemStatement,
      goalStatement,
      inScope,
      outOfScope,
      benefits,
      champion,
      championRole,
      lead,
      leadRole,
      smeList,
      projectTeam,
      phases,
      tasks,
    };

    const creatorEmpId = req.user?.empId;
    const updateDoc = {
      $set: payload,
    };
    if (creatorEmpId) {
      updateDoc.$setOnInsert = { createdByEmpId: creatorEmpId };
    }

    const result = await ProjectCharter.findOneAndUpdate(
      { clientProjectId: id },
      updateDoc,
      { new: true, upsert: true }
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("Upsert project charter error:", err);
    return res
      .status(500)
      .json({ message: "Failed to save project charter", error: err.message });
  }
};

const getProjectCharter = async (req, res) => {
  try {
    const { projectId } = req.params;
    const item = await ProjectCharter.findOne({ clientProjectId: projectId });
    if (!item) {
      return res.status(404).json({ message: "Project charter not found" });
    }
    return res.json(item);
  } catch (err) {
    console.error("Get project charter error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch project charter", error: err.message });
  }
};

const listProjectCharters = async (req, res) => {
  try {
    let items = await ProjectCharter.find().sort({ createdAt: -1 });

    const viewer = req.user;

    if (viewer && viewer.role !== ROLES.SUPER_ADMIN) {
      const allowedEmpIds = await computeAdminGroupEmpIds(viewer);
      if (!allowedEmpIds) {
        return res.json(items);
      }

      items = items.filter(
        (p) => p.createdByEmpId && allowedEmpIds.includes(p.createdByEmpId)
      );
    }

    return res.json(items);
  } catch (err) {
    console.error("List project charters error:", err);
    return res
      .status(500)
      .json({ message: "Failed to list project charters", error: err.message });
  }
};

const getAssignedProjects = async (req, res) => {
  try {
    const { empId } = req.params;
    if (!empId) {
      return res.status(400).json({ message: "empId is required" });
    }

    const emp = await Employee.findOne({ empId }).select("empName").lean();
    const empName = emp?.empName || "";

    const allItems = await ProjectCharter.find().sort({ createdAt: -1 }).lean();

    // Restrict to projects inside the same admin batch as the viewer
    let items = allItems;
    if (req.user && req.user.role !== ROLES.SUPER_ADMIN) {
      const allowedEmpIds = await computeAdminGroupEmpIds(req.user);
      if (allowedEmpIds) {
        items = allItems.filter(
          (p) => p.createdByEmpId && allowedEmpIds.includes(p.createdByEmpId)
        );
      }
    }

    const assigned = items.filter((p) => {
      if (p.champion === empName || p.lead === empName) return true;
      return (p.projectTeam || []).some(
        (m) => m.id === empId || m.name === empName
      );
    });

    return res.json(assigned);
  } catch (err) {
    console.error("Get assigned projects error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch assigned projects", error: err.message });
  }
};

const deleteProjectCharter = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await ProjectCharter.findOneAndDelete({
      clientProjectId: projectId,
    });
    if (!result) {
      return res.status(404).json({ message: "Project charter not found" });
    }
    return res
      .status(200)
      .json({ message: "Project charter deleted", id: projectId });
  } catch (err) {
    console.error("Delete project charter error:", err);
    return res
      .status(500)
      .json({ message: "Failed to delete project charter", error: err.message });
  }
};

module.exports = {
  upsertProjectCharter,
  getProjectCharter,
  listProjectCharters,
  getAssignedProjects,
  deleteProjectCharter,
};

const ProjectCharter = require("../models/projectCharter.model");

// Create or update a project charter for a given client-side project id
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

    const existing = await ProjectCharter.findOneAndUpdate(
      { clientProjectId: id },
      { $set: payload },
      { new: true, upsert: true }
    );

    return res.status(200).json(existing);
  } catch (err) {
    console.error("Error upserting project charter", err);
    return res
      .status(500)
      .json({ message: "Failed to save project charter data" });
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
    console.error("Error fetching project charter", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch project charter data" });
  }
};

const listProjectCharters = async (_req, res) => {
  try {
    const items = await ProjectCharter.find().sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    console.error("Error listing project charters", err);
    return res
      .status(500)
      .json({ message: "Failed to list project charter data" });
  }
};

// Get projects assigned to an employee (champion, lead, or in projectTeam)
const getAssignedProjects = async (req, res) => {
  try {
    const { empId } = req.params;
    if (!empId) {
      return res.status(400).json({ message: "empId is required" });
    }

    const Employee = require("../models/employee.model");
    const emp = await Employee.findOne({ empId }).select("empName").lean();
    const empName = emp?.empName || "";

    const allItems = await ProjectCharter.find().sort({ createdAt: -1 }).lean();
    const assigned = allItems.filter((p) => {
      if (p.champion === empName || p.lead === empName) return true;
      const inTeam = (p.projectTeam || []).some(
        (m) => m.id === empId || m.name === empName
      );
      return inTeam;
    });

    return res.json(assigned);
  } catch (err) {
    console.error("Error fetching assigned projects", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch assigned projects" });
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
    return res.status(200).json({ message: "Project charter deleted", id: projectId });
  } catch (err) {
    console.error("Error deleting project charter", err);
    return res
      .status(500)
      .json({ message: "Failed to delete project charter" });
  }
};

module.exports = {
  upsertProjectCharter,
  getProjectCharter,
  listProjectCharters,
  getAssignedProjects,
  deleteProjectCharter,
};


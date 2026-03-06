const Employee = require("../models/Employee.model");
const SpacesMeta = require("../models/SpacesMeta.model");
const SpacesTask = require("../models/SpacesTask.model");
const { ROLES } = require("../config/roles");

async function computeAdminGroup(viewer) {
  if (!viewer?.empId) return null;

  const self =
    (await Employee.findOne({ empId: viewer.empId })
      .select("_id empId role createdBy empName")
      .lean()) || null;

  // If, for some reason, the employee record is missing in Mongo
  // but we still have a valid JWT, fall back to treating the viewer
  // as their own root group so Spaces continues to work.
  if (!self) {
    return {
      groupEmpId: viewer.empId,
      allowedEmpIds: [viewer.empId],
      viewer: {
        _id: null,
        empId: viewer.empId,
        role: viewer.role || ROLES.EMPLOYEE,
        createdBy: null,
        empName: viewer.name || "",
      },
    };
  }

  let root = self;
  const visited = new Set();
  while (root.createdBy) {
    const key = String(root.createdBy);
    if (visited.has(key)) break;
    visited.add(key);
    const parent = await Employee.findById(root.createdBy)
      .select("_id empId role createdBy empName")
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
  if (root.empId) allowedEmpIds.add(root.empId);

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
      if (child.empId) allowedEmpIds.add(child.empId);
    }
  }

  return {
    groupEmpId: root.empId || self.empId,
    allowedEmpIds: Array.from(allowedEmpIds),
    viewer: self,
  };
}

async function ensureMeta(groupEmpId) {
  if (!groupEmpId) return null;
  const existing = await SpacesMeta.findOne({ groupEmpId }).lean();
  if (existing) return existing;
  const created = await SpacesMeta.create({ groupEmpId, columns: [] });
  return created.toObject();
}

const getSpaces = async (req, res) => {
  try {
    const group = await computeAdminGroup(req.user);
    if (!group?.groupEmpId) {
      return res.json({ columns: [], tasks: [] });
    }
    const meta = await ensureMeta(group.groupEmpId);

    const baseFilter = { groupEmpId: group.groupEmpId };
    const allTasks = await SpacesTask.find(baseFilter).sort({ createdAt: -1 }).lean();

    const viewerRole = req.user?.role;
    const viewerEmpId = req.user?.empId;

    let tasks = allTasks;
    if (viewerRole === ROLES.EMPLOYEE && viewerEmpId) {
      const managerRoles = new Set([
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN,
        ROLES.TEAM_LEAD,
      ]);
      tasks = allTasks.filter((t) => {
        const createdByRole = (t.createdByRole || "").toUpperCase();
        if (t.createdByEmpId === viewerEmpId) return true;
        if (managerRoles.has(createdByRole)) return true;
        return false;
      });
    }

    return res.json({
      columns: meta?.columns || [],
      tasks: tasks.map((t) => ({
        taskId: t.taskId,
        title: t.title,
        description: t.description || "",
        projectId: t.projectId || "",
        assigneeId: t.assigneeId || "",
        dueDate: t.dueDate || "",
        priority: t.priority || "medium",
        status: t.status || "todo",
        comments: Array.isArray(t.comments) ? t.comments : [],
        customFields: t.customFields || {},
        createdByEmpId: t.createdByEmpId || "",
        createdByName: t.createdByName || "",
        createdByRole: t.createdByRole || "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Get spaces error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch spaces data", error: err.message });
  }
};

const addSpacesColumn = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Column name is required" });
    }

    const group = await computeAdminGroup(req.user);
    if (!group?.groupEmpId) {
      return res.status(400).json({ message: "Unable to determine group" });
    }

    const now = new Date().toISOString();
    const newCol = {
      id: `col-${Date.now()}`,
      name,
      createdByEmpId: req.user?.empId,
      createdAt: now,
    };

    const meta = await ensureMeta(group.groupEmpId);
    const existing = (meta?.columns || []).some(
      (c) => String(c.name || "").toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ message: "Column already exists" });
    }

    await SpacesMeta.updateOne(
      { groupEmpId: group.groupEmpId },
      { $push: { columns: newCol } }
    );

    const updated = await SpacesMeta.findOne({ groupEmpId: group.groupEmpId }).lean();
    return res.json({ columns: updated?.columns || [] });
  } catch (err) {
    console.error("Add spaces column error:", err);
    return res
      .status(500)
      .json({ message: "Failed to add column", error: err.message });
  }
};

const createSpacesTask = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    if (!title) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const group = await computeAdminGroup(req.user);
    if (!group?.groupEmpId) {
      return res.status(400).json({ message: "Unable to determine group" });
    }

    const now = new Date().toISOString();
    const doc = await SpacesTask.create({
      taskId: `st-${Date.now()}`,
      groupEmpId: group.groupEmpId,
      title,
      description: String(req.body?.description || "").trim(),
      projectId: String(req.body?.projectId || "").trim(),
      assigneeId: String(req.body?.assigneeId || "").trim(),
      dueDate: String(req.body?.dueDate || "").trim(),
      priority: req.body?.priority || "medium",
      status: req.body?.status || "todo",
      customFields: req.body?.customFields || {},
      createdByEmpId: req.user?.empId,
      createdByName: req.user?.name,
      createdByRole: req.user?.role,
      comments: [],
    });

    return res.status(201).json({
      taskId: doc.taskId,
      title: doc.title,
      description: doc.description || "",
      projectId: doc.projectId || "",
      assigneeId: doc.assigneeId || "",
      dueDate: doc.dueDate || "",
      priority: doc.priority || "medium",
      status: doc.status || "todo",
      comments: [],
      customFields: doc.customFields || {},
      createdByEmpId: doc.createdByEmpId || "",
      createdByName: doc.createdByName || "",
      createdByRole: doc.createdByRole || "",
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("Create spaces task error:", err);
    return res
      .status(500)
      .json({ message: "Failed to create task", error: err.message });
  }
};

const updateSpacesTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!taskId) return res.status(400).json({ message: "taskId is required" });

    const group = await computeAdminGroup(req.user);
    if (!group?.groupEmpId) {
      return res.status(400).json({ message: "Unable to determine group" });
    }

    const filter = { taskId, groupEmpId: group.groupEmpId };
    if (req.user?.role === ROLES.EMPLOYEE) {
      filter.createdByEmpId = req.user.empId;
    }

    const allowed = [
      "title",
      "description",
      "projectId",
      "assigneeId",
      "dueDate",
      "priority",
      "status",
      "customFields",
    ];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }

    const updated = await SpacesTask.findOneAndUpdate(
      filter,
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Task not found" });

    return res.json({
      taskId: updated.taskId,
      title: updated.title,
      description: updated.description || "",
      projectId: updated.projectId || "",
      assigneeId: updated.assigneeId || "",
      dueDate: updated.dueDate || "",
      priority: updated.priority || "medium",
      status: updated.status || "todo",
      comments: Array.isArray(updated.comments) ? updated.comments : [],
      customFields: updated.customFields || {},
      createdByEmpId: updated.createdByEmpId || "",
      createdByName: updated.createdByName || "",
      createdByRole: updated.createdByRole || "",
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error("Update spaces task error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update task", error: err.message });
  }
};

const addSpacesComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!taskId) return res.status(400).json({ message: "taskId is required" });
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const group = await computeAdminGroup(req.user);
    if (!group?.groupEmpId) {
      return res.status(400).json({ message: "Unable to determine group" });
    }

    const filter = { taskId, groupEmpId: group.groupEmpId };
    if (req.user?.role === ROLES.EMPLOYEE) {
      filter.createdByEmpId = req.user.empId;
    }

    const now = new Date().toISOString();
    const comment = {
      id: `cm-${Date.now()}`,
      text,
      fromEmpId: req.user?.empId,
      fromName: req.user?.name,
      createdAt: now,
    };

    const updated = await SpacesTask.findOneAndUpdate(
      filter,
      { $push: { comments: comment } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Task not found" });
    return res.json({ comments: updated.comments || [] });
  } catch (err) {
    console.error("Add spaces comment error:", err);
    return res
      .status(500)
      .json({ message: "Failed to add comment", error: err.message });
  }
};

const updateSpacesComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    if (!taskId || !commentId) {
      return res.status(400).json({ message: "taskId and commentId are required" });
    }
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const group = await computeAdminGroup(req.user);
    if (!group?.groupEmpId) {
      return res.status(400).json({ message: "Unable to determine group" });
    }

    const baseFilter = {
      taskId,
      groupEmpId: group.groupEmpId,
      "comments.id": commentId,
    };

    // Only the comment author can edit (SUPER_ADMIN can edit any)
    if (req.user?.role !== ROLES.SUPER_ADMIN) {
      baseFilter["comments.fromEmpId"] = req.user?.empId;
    }

    const now = new Date().toISOString();
    const updated = await SpacesTask.findOneAndUpdate(
      baseFilter,
      {
        $set: {
          "comments.$.text": text,
          "comments.$.editedAt": now,
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res
        .status(403)
        .json({ message: "Not allowed to edit this comment or comment not found" });
    }

    return res.json({ comments: updated.comments || [] });
  } catch (err) {
    console.error("Update spaces comment error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update comment", error: err.message });
  }
};

const deleteSpacesComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    if (!taskId || !commentId) {
      return res.status(400).json({ message: "taskId and commentId are required" });
    }

    const group = await computeAdminGroup(req.user);
    if (!group?.groupEmpId) {
      return res.status(400).json({ message: "Unable to determine group" });
    }

    const baseFilter = {
      taskId,
      groupEmpId: group.groupEmpId,
      "comments.id": commentId,
    };

    // Only the comment author can delete (SUPER_ADMIN can delete any)
    if (req.user?.role !== ROLES.SUPER_ADMIN) {
      baseFilter["comments.fromEmpId"] = req.user?.empId;
    }

    const updated = await SpacesTask.findOneAndUpdate(
      baseFilter,
      { $pull: { comments: { id: commentId } } },
      { new: true }
    ).lean();

    if (!updated) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this comment or comment not found" });
    }

    return res.json({ comments: updated.comments || [] });
  } catch (err) {
    console.error("Delete spaces comment error:", err);
    return res
      .status(500)
      .json({ message: "Failed to delete comment", error: err.message });
  }
};

const deleteSpacesTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!taskId) return res.status(400).json({ message: "taskId is required" });

    const group = await computeAdminGroup(req.user);
    if (!group?.groupEmpId) {
      return res.status(400).json({ message: "Unable to determine group" });
    }

    const filter = {
      taskId,
      groupEmpId: group.groupEmpId,
      createdByEmpId: req.user?.empId,
    };

    // Allow SUPER_ADMIN to delete any task in the group
    if (req.user?.role === ROLES.SUPER_ADMIN) {
      delete filter.createdByEmpId;
    }

    const deleted = await SpacesTask.findOneAndDelete(filter).lean();
    if (!deleted) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this task or task not found" });
    }

    return res.json({ success: true, taskId });
  } catch (err) {
    console.error("Delete spaces task error:", err);
    return res
      .status(500)
      .json({ message: "Failed to delete task", error: err.message });
  }
};

module.exports = {
  getSpaces,
  addSpacesColumn,
  createSpacesTask,
  updateSpacesTask,
  addSpacesComment,
  updateSpacesComment,
  deleteSpacesComment,
  deleteSpacesTask,
};


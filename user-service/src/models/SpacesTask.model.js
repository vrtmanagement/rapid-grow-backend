const mongoose = require("mongoose");

const SpacesCommentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    fromEmpId: { type: String },
    fromName: { type: String },
    createdAt: { type: String, required: true },
    editedAt: { type: String },
  },
  { _id: false }
);

const SpacesTaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    groupEmpId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    projectId: { type: String },
    assigneeId: { type: String },
    dueDate: { type: String },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: {
      type: String,
      enum: ["todo", "doing", "review", "done", "blocked"],
      default: "todo",
    },
    comments: { type: [SpacesCommentSchema], default: [] },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdByEmpId: { type: String, index: true },
    createdByName: { type: String },
    createdByRole: { type: String },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SpacesTask || mongoose.model("SpacesTask", SpacesTaskSchema);


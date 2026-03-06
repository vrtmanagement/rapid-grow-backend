const mongoose = require("mongoose");

const ProjectTeamMemberSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
);

const TaskMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    from: { type: String },
    status: {
      type: String,
      enum: ["todo", "doing", "review", "done", "blocked"],
    },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const WorkspaceTaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    messages: { type: [TaskMessageSchema], default: [] },
    status: {
      type: String,
      enum: ["todo", "doing", "review", "done", "blocked"],
      required: true,
    },
    priority: { type: String, enum: ["low", "medium", "high"], required: true },
    linkedGoalId: { type: String },
    linkedGoalLevel: {
      type: String,
      enum: ["year", "quarter", "month", "week", "day"],
    },
    assigneeId: { type: String },
    prerequisiteId: { type: String },
    dueDate: { type: String },
    createdBy: { type: String },
    createdByRole: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false }
);

// Allow dynamic phase keys (phase1, phase2, ... phaseN)
const ProjectPhasesSchema = new mongoose.Schema(
  {},
  {
    _id: false,
    strict: false,
  }
);

const ProjectCharterSchema = new mongoose.Schema(
  {
    clientProjectId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "ready", "launched", "completed", "archived"],
      default: "draft",
    },
    dateCreated: { type: String },
    businessCase: { type: String },
    problemStatement: { type: String },
    goalStatement: { type: String },
    inScope: { type: String },
    outOfScope: { type: String },
    benefits: { type: String },
    champion: { type: String },
    championRole: { type: String },
    lead: { type: String },
    leadRole: { type: String },
    createdByEmpId: { type: String },
    smeList: { type: [ProjectTeamMemberSchema], default: [] },
    projectTeam: { type: [ProjectTeamMemberSchema], default: [] },
    phases: { type: ProjectPhasesSchema, default: {} },
    tasks: { type: [WorkspaceTaskSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectCharter", ProjectCharterSchema);

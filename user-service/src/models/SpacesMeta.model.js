const mongoose = require("mongoose");

const SpacesColumnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    createdByEmpId: { type: String },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const SpacesMetaSchema = new mongoose.Schema(
  {
    groupEmpId: { type: String, required: true, unique: true, index: true },
    columns: { type: [SpacesColumnSchema], default: [] },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SpacesMeta || mongoose.model("SpacesMeta", SpacesMetaSchema);


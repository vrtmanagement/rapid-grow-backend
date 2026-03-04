const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Employee = require("../models/employee.model");
const { ROLES } = require("../config/roles");

dotenv.config();

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is not set in environment");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding");

    const existing = await Employee.findOne({ role: ROLES.SUPER_ADMIN });
    if (existing) {
      console.log("SUPER_ADMIN already exists with empId:", existing.empId);
      await mongoose.disconnect();
      return;
    }

    const email =
      process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@example.com";
    const password =
      process.env.SEED_SUPER_ADMIN_PASSWORD || "ChangeMe123!";

    const superAdmin = new Employee({
      empId: "SUPER_ADMIN_1",
      empName: "Super Admin",
      designation: "SUPER_ADMIN",
      department: "Administration",
      password,
      email,
      status: "active",
      role: ROLES.SUPER_ADMIN,
    });

    await superAdmin.save();

    console.log("SUPER_ADMIN created:", {
      id: superAdmin._id.toString(),
      empId: superAdmin.empId,
      email: superAdmin.email,
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Failed to seed SUPER_ADMIN:", err);
    process.exitCode = 1;
  }
}

seed();


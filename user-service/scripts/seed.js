/**
 * Seed Super Admin - run from user-service (has Employee model)
 * npm run seed
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const Employee = require("../src/models/Employee.model");
const { ROLES } = require("../src/config/roles");

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI not set. Copy .env.example to .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await Employee.findOne({ role: ROLES.SUPER_ADMIN });
    if (existing) {
      console.log("SUPER_ADMIN exists:", existing.empId);
      await mongoose.disconnect();
      return;
    }

    const password = process.env.SEED_PASSWORD || "ChangeMe123!";
    const superAdmin = new Employee({
      empId: "SUPER_ADMIN_1",
      empName: "Super Admin",
      designation: "SUPER_ADMIN",
      department: "Administration",
      password,
      email: "superadmin@example.com",
      status: "active",
      role: ROLES.SUPER_ADMIN,
    });

    await superAdmin.save();
    console.log("SUPER_ADMIN created. Login with empId: SUPER_ADMIN_1");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();

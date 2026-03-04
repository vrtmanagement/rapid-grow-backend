const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Auth Service: Connected to MongoDB"))
  .catch((err) => console.error("Auth Service: MongoDB error", err));

app.use("/", authRoutes);

app.listen(PORT, () => {
  console.log(`Auth Service: http://localhost:${PORT} (Swagger via Gateway: http://localhost:5000/api/docs)`);
});

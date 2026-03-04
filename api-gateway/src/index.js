const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const { PORT } = require("./config");
const apiRoutes = require("./routes/api.routes");
const swaggerDocument = require("./swagger");

const app = express();
const port = PORT;

app.use(cors());
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (_req, res) => {
  res.send("Rapid Grow API Gateway - use /api/* for routes");
});

app.get("/api/test", (_req, res) => {
  res.json({ message: "API Gateway working" });
});

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(port, () => {
  const swaggerUrl = `http://localhost:${port}/api/docs`;
  console.log("\n  ========================================");
  console.log(`  Swagger UI:  ${swaggerUrl}`);
  console.log("  ========================================");
  console.log("  Run: npm run seed (creates SUPER_ADMIN_1)");
  console.log("  Login: empId=SUPER_ADMIN_1, password=ChangeMe123!");
  console.log("  ========================================\n");
});

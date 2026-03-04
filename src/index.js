const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("\n  ========================================");
  console.log(`  Unified Backend listening on port ${PORT}`);
  console.log(`  Swagger UI:  http://localhost:${PORT}/api/docs`);
  console.log("  ========================================");
});


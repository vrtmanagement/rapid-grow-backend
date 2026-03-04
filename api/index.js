const app = require("../src/app");

// Export the Express app directly so platforms like Vercel
// can run it as a serverless function.
module.exports = app;


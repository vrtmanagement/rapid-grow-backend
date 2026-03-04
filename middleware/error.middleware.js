function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("API error:", err);
  }

  res.status(status).json({ message });
}

module.exports = errorHandler;


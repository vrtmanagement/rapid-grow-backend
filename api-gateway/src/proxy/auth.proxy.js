const axios = require("axios");
const { AUTH_SERVICE_URL } = require("../config");

async function proxyLogin(req, res) {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/login`,
      req.body,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { message: "Auth service error" };
    res.status(status).json(data);
  }
}

module.exports = { proxyLogin };

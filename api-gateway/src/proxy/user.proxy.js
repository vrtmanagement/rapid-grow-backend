const axios = require("axios");
const { USER_SERVICE_URL } = require("../config");

function proxyToUserService(req, res, path) {
  const url = `${USER_SERVICE_URL}${path}`;
  const headers = {
    "Content-Type": req.headers["content-type"] || "application/json",
    ...(req.headers.authorization && { Authorization: req.headers.authorization }),
  };
  const config = {
    method: req.method,
    url,
    headers,
    timeout: 10000,
  };
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.body && Object.keys(req.body).length) {
    config.data = req.body;
  }

  axios(config)
    .then((response) => res.status(response.status).json(response.data))
    .catch((err) => {
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: "User service error" };
      res.status(status).json(data);
    });
}

module.exports = { proxyToUserService };

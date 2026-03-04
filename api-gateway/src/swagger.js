module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Rapid Grow API Gateway",
    version: "1.0.0",
    description:
      "Microservices: Auth (5001), User (5002). Gateway proxies to both.",
  },
  servers: [{ url: "http://localhost:5000", description: "API Gateway" }],
  tags: [
    { name: "Auth", description: "Login (Auth Service)" },
    { name: "Users", description: "Employees (User Service)" },
    { name: "Project Charters", description: "Projects (User Service)" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: {
    "/api/employees/login": {
      post: {
        summary: "Login",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  empId: { type: "string" },
                  password: { type: "string" },
                },
                required: ["empId", "password"],
              },
            },
          },
        },
        responses: {
          200: { description: "Returns token and employee" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/employees": {
      post: {
        summary: "Create employee (RBAC)",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Employee created" } },
      },
      get: {
        summary: "List employees",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of employees" } },
      },
    },
    "/api/project-charters": {
      post: { summary: "Create/update project", tags: ["Project Charters"] },
      get: { summary: "List projects", tags: ["Project Charters"] },
    },
    "/api/project-charters/assigned/{empId}": {
      get: { summary: "Projects assigned to employee", tags: ["Project Charters"] },
    },
    "/api/project-charters/{projectId}": {
      get: { summary: "Get project", tags: ["Project Charters"] },
      delete: { summary: "Delete project", tags: ["Project Charters"] },
    },
  },
};

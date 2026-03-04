# Rapid Grow Backend (Microservices)

Single entry backend for **rapid-grow-performance-hub** (admin) and **rapid-grow-user-frontend** (user portal).

## Structure

```
rapid-grow-backend-admin/
├── api-gateway/      → Port 5000 (proxy + Swagger)
├── auth-service/     → Port 5001 (login, JWT)
├── user-service/     → Port 5002 (employees, project charters)
```

Each service is **fully independent** with its own `package.json`, `node_modules`, `.env`, and `src/`.

## Setup

1. **Copy `.env.example` to `.env`** in each service folder.

2. **Install dependencies** in each service:
   ```bash
   cd api-gateway && npm install
   cd ../auth-service && npm install
   cd ../user-service && npm install
   ```

3. **Environment** – All services share the same MongoDB. Set in each `.env`:
   - `MONGO_URI=mongodb://localhost:27017/rapidgrow`
   - `JWT_SECRET` must be the same in auth-service and user-service

4. **Seed** (from user-service):
   ```bash
   cd user-service && npm run seed
   ```

5. **Run all services** (from `rapid-grow-backend-admin`):

   ```bash
   npm run dev
   ```

   This starts Gateway, Auth, and User. Swagger link and login hint are printed in the terminal.

6. **Seed** (in a new terminal):

   ```bash
   npm run seed
   ```

**API base**: `http://localhost:5000/api`  
**Swagger**: `http://localhost:5000/api/docs`  
**Login**: `empId=SUPER_ADMIN_1`, `password=ChangeMe123!`

**Individual services** (optional):

   ```bash
   npm run dev:gateway   # API Gateway only
   npm run dev:auth     # Auth Service only
   npm run dev:user    # User Service only
   ```

## Ports

| Service     | Port | URL                     |
|-------------|------|-------------------------|
| API Gateway | 5000 | http://localhost:5000   |
| Auth Service| 5001 | http://localhost:5001   |
| User Service| 5002 | http://localhost:5002   |

## RBAC

| Role       | Can Create              |
|------------|-------------------------|
| SUPER_ADMIN| Admin, Team Lead, Employee |
| ADMIN      | Team Lead, Employee     |
| TEAM_LEAD  | Employee                |
| EMPLOYEE   | No one                 |


# Vehicle Service and Maintenance Tracker

A MERN application with JWT authentication, vehicle management, service history, maintenance reminders, Docker Compose, GitHub Actions, Kubernetes manifests, Prometheus metrics, Grafana provisioning, Terraform example, and Trivy scanning.

## Requirements

- Node.js 20+
- Docker Desktop
- Git
- Optional later: kubectl, Minikube, Terraform, Argo CD

## Run locally (without Docker)

1. Copy `server/.env.example` to `server/.env` and set a strong `JWT_SECRET`.
2. Start MongoDB locally, or use MongoDB Atlas and set `MONGODB_URI`.
3. In terminal 1:

   ```bash
   cd server
   npm install
   npm run dev
   ```

4. In terminal 2:

   ```bash
   cd client
   npm install
   npm run dev
   ```

5. Open the Vite URL shown in the terminal.

## Run with Docker Compose

1. From the repository root, run:

   ```bash
   docker compose up --build
   ```

2. Open [http://localhost:5173](http://localhost:5173).

The Compose configuration supplies the database connection and JWT secret for the local demo. Keep real secrets out of Git.

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/vehicles`
- `GET/PUT/DELETE /api/vehicles/:id`
- `GET/POST /api/vehicles/:id/services`
- `PUT/DELETE /api/services/:id`
- `GET/POST /api/vehicles/:id/reminders`
- `PUT /api/reminders/:id`
- `GET /api/dashboard`
- `GET /metrics`

All vehicle, service, and reminder endpoints require `Authorization: Bearer <token>`. Ownership is checked server-side.

## Testing

```bash
cd server
npm install
npm test
```

The tests use an isolated in-memory MongoDB database.

## DevOps stages

1. GitHub Actions runs backend tests and the frontend build.
2. Dockerfiles build separate frontend and backend images.
3. Kubernetes manifests provide examples for a local Minikube cluster. Configure image names and secrets before applying.
4. Prometheus scrapes `/metrics`; Grafana is provisioned with a starter dashboard.
5. Terraform contains a local Kubernetes provider example. Initialize and validate only after installing Terraform and configuring a cluster.
6. Argo CD can point to `k8s/` as the desired-state directory.
7. Trivy scans the source filesystem for known vulnerabilities and other findings.

## Security notes

- Never commit `.env` files or real secrets.
- Change `JWT_SECRET` before running outside a local demo.
- Use HTTPS, rate limiting, robust validation, backups, and managed secrets for a real deployment.
- Kubernetes Secret values are base64-encoded, not automatically encrypted at rest.
- This starter is for learning and demonstration, not a production-ready vehicle or document compliance service.

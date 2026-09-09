# Smart Community — Local Workspace

## Run locally

1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env to set JWT_SECRET and MONGODB_URI if needed
npm start
```

2. Frontend

Open http://localhost:5000 in your browser after starting the backend.

## Notes
- Move secrets to a secure store for production.
- Consider using a process manager (pm2) or containerization for production deployment.

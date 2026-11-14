# Smart Community Platform

## Run locally

1. Copy `backend\.env.example` to `backend\.env` and set a unique random `JWT_SECRET` (at least 32 characters) plus a reachable `MONGODB_URI`.
2. Start the API and static frontend:

```bash
cd backend
npm install
npm start
```

Open http://localhost:5000 after the server reports a successful MongoDB connection. The first start adds missing default categories without replacing existing categories.
The backend requires Node.js 20 or newer.

## Marketplace roles

- Customers search service listings, create service requests, track/cancel eligible requests, and review completed work.
- Providers maintain a public profile and service listings, then accept/reject requests and progress accepted jobs through completion.
- Request history is visible to the request participants; dashboard notifications are persisted and refresh while the dashboard is open.
- Customers and their assigned providers can exchange persistent messages within a service request. Conversation reads and sends require an authenticated request participant.
- Customers can save providers from service listings and manage their saved-provider list in the customer dashboard.
- Individual service listings have a detail page with provider information, ratings, reviews, and a request form backed by the existing API.
- Live location remains restricted to an authenticated provider and the provider's active accepted/in-progress service relationships.

## Marketplace API additions

- `GET /api/notifications/mine` lists the authenticated user's notifications and unread count.
- `PATCH /api/notifications/:id/read` and `PATCH /api/notifications/mine/read-all` update notification read state.
- `GET /api/messages/:requestId` loads a request conversation and marks incoming messages as read.
- `POST /api/messages/:requestId` sends a message to the other request participant; message text is limited to 2,000 characters, and sends are rate-limited.
- `GET /api/favorites` lists the authenticated customer's saved providers.
- `POST /api/favorites/:providerId` saves a provider; `DELETE /api/favorites/:providerId` removes that customer's saved provider.
- `GET /api/services/:id` provides the listing data used by the standalone `frontend/service-detail.html` page.

## Deployment requirements

The static frontend calls a same-origin `/api` (and `http://localhost:5000/api` locally). The Express API now ships as one Vercel serverless function (`api/index.js`) so the existing production domain can serve both the site and the API.

### Vercel project settings

1. Set **Root Directory** to the repository root (not `frontend/`).
2. Framework preset: **Other**. Leave the build command empty; `vercel.json` sets the output directory to `frontend`.
3. Add environment variables in **Project → Settings → Environment Variables** for Production (and Preview if used):
   - `MONGODB_URI` — MongoDB Atlas connection string.
   - `JWT_SECRET` — random value of at least 32 characters.
   - `CORS_ORIGIN` — optional; only needed for cross-origin clients. Same-origin requests work without it.
4. Redeploy. `/api/health` returns `200 {"status":"ok"}` once MongoDB is connected and `503` until the database is reachable.

The quickest database setup is the **MongoDB Atlas** integration in the Vercel Marketplace, which provisions a free cluster and adds `MONGODB_URI` automatically. A manually created Atlas cluster works too: create a database user, allow Vercel's outbound IPs (or `0.0.0.0/0` for a first test), and copy the connection string.

SMTP variables are required only for the contact form. The API exposes `/api/health` and returns a non-success status until MongoDB is connected.

Never commit `.env` files or production credentials. Deploy only after the backend health endpoint, authenticated role flows, database-backed marketplace requests, and the production build have all been verified.

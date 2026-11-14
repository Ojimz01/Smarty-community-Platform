const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { connectDatabase } = require("./lib/database");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-community";
const frontendPath = path.resolve(__dirname, "../frontend");

if (process.env.VERCEL) {
  // Vercel terminates TLS in front of the function, so rate limiting needs the
  // forwarded client address rather than the proxy socket address.
  app.set("trust proxy", 1);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many auth attempts. Please try again later."
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many contact submissions. Please try again later."
});

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(frontendPath));

// Only the credential endpoints are rate-limited; authenticated reads such as
// /api/auth/me must stay available for normal dashboard page loads.
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/contact", contactLimiter, require("./routes/contact"));
app.use("/api/services", require("./routes/services"));
app.use("/api/providers", require("./routes/providers"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/location", require("./routes/location"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/favorites", require("./routes/favorites"));

app.get("/api/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "database-unavailable" });
});

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  await connectDatabase(MONGODB_URI);
  console.log("Connected to MongoDB");
  return app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start Smart Community:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };

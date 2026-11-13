const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const ServiceCategory = require("./models/ServiceCategory");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-community";
const frontendPath = path.resolve(__dirname, "../frontend");

const seedServiceCategories = async () => {
  const defaults = [
    { name: "Plumbing", description: "Fix leaks and pipe issues with local professionals." },
    { name: "Electrical", description: "Wiring, repairs, and installations." },
    { name: "Cleaning", description: "Home, office, and deep-cleaning services." },
    { name: "Car repairs", description: "Automotive repair and maintenance." },
    { name: "Painting", description: "Interior and exterior painting services." },
    { name: "Carpentry", description: "Custom woodwork, repairs, and fittings." },
    { name: "Catering", description: "Food preparation and catering for events." },
    { name: "Fashion and tailoring", description: "Garment design, alterations, and tailoring." },
    { name: "Hairdressing", description: "Hair styling and care services." },
    { name: "Computer repairs", description: "Computer diagnostics, repair, and setup." },
    { name: "Landscaping", description: "Garden design, maintenance, and outdoor upgrades." },
    { name: "Other useful services", description: "Other services offered by local professionals." }
  ];

  await Promise.all(defaults.map(({ name, description }) =>
    ServiceCategory.updateOne({ name }, { $setOnInsert: { name, description, isActive: true } }, { upsert: true })
  ));
};

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
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");
  await seedServiceCategories();
  return app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start Smart Community:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const ServiceCategory = require("./models/ServiceCategory");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-community";

const seedServiceCategories = async () => {
  const defaults = [
    { name: "Plumbing", description: "Fix leaks and pipe issues with trusted professionals." },
    { name: "Electrical", description: "Wiring, repairs, and installations by qualified electricians." },
    { name: "Carpentry", description: "Custom woodwork, repairs, and fittings for the home." },
    { name: "Painting", description: "Interior and exterior painting for homes and businesses." },
    { name: "Cleaning", description: "Professional cleaning services for homes and workspaces." },
    { name: "Landscaping", description: "Garden design, maintenance, and outdoor upgrades." }
  ];

  const count = await ServiceCategory.countDocuments();
  if (count === 0) {
    await ServiceCategory.insertMany(defaults);
    console.log("Seeded default service categories.");
  }
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

app.use(cors());
app.use(express.json());
app.use(express.static("../frontend"));

app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/contact", contactLimiter, require("./routes/contact"));
app.use("/api/services", require("./routes/services"));
app.use("/api/providers", require("./routes/providers"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/location", require("./routes/location"));

mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log("Connected to MongoDB");
  await seedServiceCategories();
})
.catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

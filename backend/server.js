const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-community";

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
app.use("/api/location", require("./routes/location"));

mongoose.connect(MONGODB_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-community";

// Rate limiting for APIs
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many auth attempts. Please try again later.'
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 contact submissions per hour
  message: 'Too many contact submissions. Please try again later.'
});

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("../frontend"))

// Routes with rate limiting
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/contact", contactLimiter, require("./routes/contact"));

// Database connection
mongoose.connect(MONGODB_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log(err));

// Start the server
app.listen(PORT, () =>
    console.log(`Server is running on port ${PORT}`)
);

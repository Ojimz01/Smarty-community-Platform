const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
require("dotenv").config();

//REGISTER
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const extistingUser = await User.findOne({ email });

        if (extistingUser) {
            return res.json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: "customer"
        });

        await newUser.save();

        res.json({ message: "User registered successfully" });
    } catch(err) {
        res.status(500).json({ message: "Error registering user" });
    }
});

//LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ message: "Invalid credentials" });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({ message: "Server authentication is not configured." });
        }

        const token = jwt.sign({ id: user._id, email: user.email, role: user.role || "customer" }, secret, { expiresIn: "1h" });

        res.json({ 
            message: "Login successful", 
            token: token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role || "customer"
            }
         });
    } catch (err) {
        res.status(500).json({ message: "Error logging in" });
    }
});

module.exports = router;
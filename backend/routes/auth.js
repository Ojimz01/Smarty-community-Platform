const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const xss = require("xss");
const router = express.Router();
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { validatePasswordChange } = require("../lib/passwordChange");
require("dotenv").config();

router.post("/register", async (req, res) => {
    const username = xss(String(req.body?.username || "")).trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const role = req.body?.role || "customer";

    if (username.length < 3 || username.length > 60) {
        return res.status(400).json({ message: "Username must be between 3 and 60 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return res.status(400).json({ message: "Please provide a valid email address." });
    }
    if (password.length < 6 || password.length > 128) {
        return res.status(400).json({ message: "Password must be between 6 and 128 characters." });
    }
    if (!["customer", "provider"].includes(role)) {
        return res.status(400).json({ message: "Choose a valid account type." });
    }

    try {
        const existingUser = await User.findOne({ email }).collation({ locale: "en", strength: 2 });

        if (existingUser) {
            return res.status(409).json({ message: "An account with that email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role
        });

        await newUser.save();

        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with that email already exists." });
        }
        return res.status(500).json({ message: "Unable to register your account right now." });
    }
});

router.post("/login", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
        return res.status(400).json({ message: "Enter a valid email and password." });
    }

    try {
        const user = await User.findOne({ email })
            .collation({ locale: "en", strength: 2 })
            .select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret || secret.length < 32) {
            return res.status(500).json({ message: "Server authentication is not securely configured." });
        }

        const token = jwt.sign({ id: user._id, email: user.email, role: user.role || "customer" }, secret, { expiresIn: "7d" });

        res.json({ 
            message: "Login successful", 
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role || "customer",
                phone: user.phone || "",
                location: user.location || ""
            }
         });
    } catch (err) {
        res.status(500).json({ message: "Unable to sign in right now." });
    }
});

router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password").lean();
        if (!user) return res.status(404).json({ message: "Account not found." });
        return res.json({
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role || "customer",
                phone: user.phone || "",
                location: user.location || ""
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to load your account." });
    }
});

router.patch("/me", requireAuth, async (req, res) => {
    const updates = {};
    if (req.body?.username !== undefined) {
        const username = xss(String(req.body.username)).trim();
        if (username.length < 3 || username.length > 60) {
            return res.status(400).json({ message: "Username must be between 3 and 60 characters." });
        }
        updates.username = username;
    }
    if (req.body?.phone !== undefined) {
        const phone = xss(String(req.body.phone)).trim();
        if (phone.length > 30) return res.status(400).json({ message: "Phone number must be 30 characters or fewer." });
        updates.phone = phone;
    }
    if (req.body?.location !== undefined) {
        const location = xss(String(req.body.location)).trim();
        if (location.length > 120) return res.status(400).json({ message: "Location must be 120 characters or fewer." });
        updates.location = location;
    }
    if (!Object.keys(updates).length) {
        return res.status(400).json({ message: "Provide at least one profile field to update." });
    }

    try {
        const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, {
            new: true,
            runValidators: true
        }).select("-password");
        if (!user) return res.status(404).json({ message: "Account not found." });
        return res.json({ message: "Account details updated.", user });
    } catch (error) {
        return res.status(500).json({ message: "Unable to update your account right now." });
    }
});

router.patch("/password", requireAuth, async (req, res) => {
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    const validation = validatePasswordChange({ currentPassword, newPassword });
    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }

    try {
        const user = await User.findById(req.user.id).select("+password");
        if (!user) return res.status(404).json({ message: "Account not found." });

        const matches = await bcrypt.compare(currentPassword, user.password || "");
        if (!matches) {
            return res.status(400).json({ message: "Your current password is incorrect." });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        return res.json({ message: "Password updated. Use your new password the next time you sign in." });
    } catch (error) {
        return res.status(500).json({ message: "Unable to update your password right now." });
    }
});

module.exports = router;
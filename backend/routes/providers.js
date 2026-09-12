const express = require("express");
const router = express.Router();
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", async (req, res) => {
    try {
        const providers = await ProviderProfile.find({})
            .populate("user", "username email role")
            .sort({ createdAt: -1 });

        return res.json({ providers });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch providers." });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const profile = await ProviderProfile.findById(req.params.id).populate("user", "username email role");

        if (!profile) {
            return res.status(404).json({ message: "Provider profile not found." });
        }

        return res.json({ profile });
    } catch (error) {
        return res.status(400).json({ message: "Invalid provider profile id." });
    }
});

router.get("/me", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user: req.user.id }).populate("user", "username email role");

        if (!profile) {
            return res.status(404).json({ message: "Provider profile not found." });
        }

        return res.json({ profile });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch provider profile." });
    }
});

router.put("/me", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ message: "User not found." });
        }

        const payload = {
            businessName: req.body.businessName ? String(req.body.businessName).trim() : "",
            bio: req.body.bio ? String(req.body.bio).trim() : "",
            phone: req.body.phone ? String(req.body.phone).trim() : "",
            location: req.body.location ? String(req.body.location).trim() : "",
            isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true
        };

        if (!payload.businessName) {
            return res.status(400).json({ message: "Business name is required." });
        }

        const profile = await ProviderProfile.findOneAndUpdate(
            { user: req.user.id },
            { $set: payload },
            { new: true, upsert: true, runValidators: true }
        ).populate("user", "username email role");

        return res.json({ message: "Provider profile updated successfully.", profile });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update provider profile." });
    }
});

module.exports = router;

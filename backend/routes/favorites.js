const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const FavoriteProvider = require("../models/FavoriteProvider");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth, requireRole("customer"));

router.get("/", async (req, res) => {
    try {
        const favorites = await FavoriteProvider.find({ customer: req.user.id })
            .populate("provider", "username")
            .sort({ createdAt: -1 })
            .lean();
        const providerIds = favorites
            .map((favorite) => favorite.provider?._id)
            .filter(Boolean);
        const profiles = await ProviderProfile.find({ user: { $in: providerIds } })
            .select("user businessName bio location isAvailable")
            .lean();
        const profileByProvider = new Map(
            profiles.map((profile) => [profile.user.toString(), profile])
        );

        return res.json({
            favorites: favorites
                .filter((favorite) => favorite.provider)
                .map((favorite) => ({
                    id: favorite._id,
                    createdAt: favorite.createdAt,
                    provider: {
                        ...favorite.provider,
                        profile: profileByProvider.get(favorite.provider._id.toString()) || null
                    }
                }))
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load saved providers." });
    }
});

router.post("/:providerId", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.providerId)) {
        return res.status(400).json({ message: "Invalid provider id." });
    }

    try {
        const provider = await User.findOne({
            _id: req.params.providerId,
            role: "provider"
        }).select("_id").lean();
        if (!provider) return res.status(404).json({ message: "Provider account not found." });

        const profile = await ProviderProfile.findOne({ user: provider._id }).select("_id").lean();
        if (!profile) return res.status(409).json({ message: "This provider has not completed a profile yet." });

        try {
            await FavoriteProvider.updateOne(
                { customer: req.user.id, provider: provider._id },
                { $setOnInsert: { customer: req.user.id, provider: provider._id } },
                { upsert: true }
            );
        } catch (error) {
            if (error.code !== 11000) throw error;
            const existing = await FavoriteProvider.exists({
                customer: req.user.id,
                provider: provider._id
            });
            if (!existing) throw error;
        }

        return res.status(200).json({ message: "Provider saved to your favorites." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to save this provider." });
    }
});

router.delete("/:providerId", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.providerId)) {
        return res.status(400).json({ message: "Invalid provider id." });
    }

    try {
        await FavoriteProvider.deleteOne({
            customer: req.user.id,
            provider: req.params.providerId
        });
        return res.json({ message: "Provider removed from your favorites." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to remove this provider." });
    }
});

module.exports = router;

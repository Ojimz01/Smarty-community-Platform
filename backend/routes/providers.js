const express = require("express");
const mongoose = require("mongoose");
const xss = require("xss");
const router = express.Router();
const ProviderProfile = require("../models/ProviderProfile");
const Service = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");
const Review = require("../models/Review");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/me", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user: req.user.id })
            .populate("user", "username role")
            .lean();
        if (!profile) {
            return res.status(404).json({ message: "Provider profile not found." });
        }
        return res.json({ profile });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch provider profile." });
    }
});

router.put("/me", requireAuth, requireRole("provider"), async (req, res) => {
    const businessName = xss(String(req.body?.businessName || "")).trim();
    const bio = xss(String(req.body?.bio || "")).trim();
    const phone = xss(String(req.body?.phone || "")).trim();
    const location = xss(String(req.body?.location || "")).trim();

    if (businessName.length < 2 || businessName.length > 100) {
        return res.status(400).json({ message: "Business name must be between 2 and 100 characters." });
    }
    if (!phone || phone.length > 30 || location.length < 2 || location.length > 120 || bio.length > 1500) {
        return res.status(400).json({ message: "Enter a valid phone number and location. The bio must be under 1,500 characters." });
    }
    if (req.body?.isAvailable !== undefined && typeof req.body.isAvailable !== "boolean") {
        return res.status(400).json({ message: "Availability must be true or false." });
    }

    try {
        const profile = await ProviderProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                $set: {
                    businessName,
                    bio,
                    phone,
                    location,
                    isAvailable: req.body?.isAvailable === undefined ? true : req.body.isAvailable
                },
                $setOnInsert: { user: req.user.id }
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        ).populate("user", "username role");
        return res.json({ message: "Provider profile updated successfully.", profile });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update provider profile." });
    }
});

router.get("/", async (req, res) => {
    try {
        const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
        const location = typeof req.query.location === "string" ? req.query.location.trim().slice(0, 120) : "";
        const categoryName = typeof req.query.category === "string" ? req.query.category.trim() : "";
        const filter = { isAvailable: true };

        if (location) filter.location = new RegExp(escapeRegex(location), "i");
        if (query) {
            const pattern = new RegExp(escapeRegex(query), "i");
            const users = await User.find({ username: pattern }).select("_id").lean();
            filter.$or = [
                { businessName: pattern },
                { bio: pattern },
                { location: pattern },
                { user: { $in: users.map((user) => user._id) } }
            ];
        }
        if (categoryName) {
            const category = await ServiceCategory.findOne({ name: categoryName, isActive: true }).select("_id").lean();
            if (!category) return res.json({ providers: [] });
            const matchingServices = await Service.find({ category: category._id, isActive: true }).select("provider").lean();
            const providerIds = [...new Set(matchingServices.map((service) => service.provider.toString()))];
            filter.user = { $in: providerIds };
        }

        const providers = await ProviderProfile.find(filter)
            .populate("user", "username role")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        return res.json({ providers });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch providers." });
    }
});

router.get("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid provider profile id." });
    }

    try {
        const profile = await ProviderProfile.findById(req.params.id)
            .populate("user", "username role")
            .lean();
        if (!profile) return res.status(404).json({ message: "Provider profile not found." });

        const [services, reviews, rating] = await Promise.all([
            Service.find({ provider: profile.user._id, isActive: true })
                .populate("category", "name description")
                .sort({ createdAt: -1 })
                .lean(),
            Review.find({ provider: profile.user._id })
                .populate("customer", "username")
                .populate("service", "name")
                .sort({ createdAt: -1 })
                .limit(30)
                .lean(),
            Review.aggregate([
                { $match: { provider: profile.user._id } },
                { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }
            ])
        ]);
        return res.json({
            profile,
            services,
            reviews: reviews.map((review) => ({
                id: review._id.toString(),
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                customerName: review.customer?.username || "Customer",
                serviceName: review.service?.name || "Service"
            })),
            rating: { average: rating[0]?.average || 0, count: rating[0]?.count || 0 }
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch provider profile." });
    }
});

module.exports = router;

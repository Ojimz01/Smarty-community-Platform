const express = require("express");
const mongoose = require("mongoose");
const xss = require("xss");
const router = express.Router();
const Service = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");
const Review = require("../models/Review");
const { requireAuth, requireRole } = require("../middleware/auth");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function sanitizeServicePayload(payload = {}, { partial = false } = {}) {
    const updates = {};
    if (!partial || payload.name !== undefined) {
        updates.name = xss(String(payload.name || "")).trim();
        if (updates.name.length < 3 || updates.name.length > 100) {
            return { error: "Service name must be between 3 and 100 characters." };
        }
    }
    if (!partial || payload.description !== undefined) {
        updates.description = xss(String(payload.description || "")).trim();
        if (updates.description.length < 10 || updates.description.length > 2000) {
            return { error: "Description must be between 10 and 2,000 characters." };
        }
    }
    if (!partial || payload.category !== undefined) {
        if (!mongoose.isValidObjectId(payload.category)) {
            return { error: "Choose a valid service category." };
        }
        updates.category = payload.category;
    }
    if (!partial || payload.price !== undefined) {
        const price = Number(payload.price);
        if (!Number.isFinite(price) || price < 0 || price > 1000000000) {
            return { error: "Enter a valid service price." };
        }
        updates.price = price;
    }
    if (!partial || payload.currency !== undefined) {
        const currency = String(payload.currency || "USD").trim().toUpperCase();
        if (!/^[A-Z]{3}$/.test(currency)) {
            return { error: "Enter a three-letter currency code, such as USD or NGN." };
        }
        updates.currency = currency;
    }
    if (!partial || payload.priceUnit !== undefined) {
        const priceUnit = payload.priceUnit || "fixed";
        if (!["fixed", "hour", "visit"].includes(priceUnit)) {
            return { error: "Choose a valid price basis." };
        }
        updates.priceUnit = priceUnit;
    }
    if (partial && payload.isActive !== undefined) {
        if (typeof payload.isActive !== "boolean") {
            return { error: "Service availability must be true or false." };
        }
        updates.isActive = payload.isActive;
    }
    return { updates };
}

router.get("/service-categories", async (req, res) => {
    try {
        const categories = await ServiceCategory.find({ isActive: true }).sort({ name: 1 }).lean();
        return res.json({ categories });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch service categories." });
    }
});

router.get("/service-categories/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid service category id." });
    }
    try {
        const category = await ServiceCategory.findOne({ _id: req.params.id, isActive: true }).lean();
        if (!category) return res.status(404).json({ message: "Service category not found." });
        return res.json({ category });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch service category." });
    }
});

router.get("/mine", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const services = await Service.find({ provider: req.user.id })
            .populate("category", "name description")
            .sort({ createdAt: -1 })
            .lean();
        return res.json({ services });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch your services." });
    }
});

router.get("/", async (req, res) => {
    try {
        const filter = { isActive: true };
        const categoryValue = typeof req.query.category === "string" ? req.query.category.trim() : "";
        const location = typeof req.query.location === "string" ? req.query.location.trim().slice(0, 120) : "";
        const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 120) : "";

        if (categoryValue) {
            const categoryFilter = mongoose.isValidObjectId(categoryValue)
                ? { _id: categoryValue, isActive: true }
                : { name: categoryValue, isActive: true };
            const category = await ServiceCategory.findOne(categoryFilter).select("_id").lean();
            if (!category) return res.json({ services: [] });
            filter.category = category._id;
        }

        if (location) {
            const profiles = await ProviderProfile.find({
                location: new RegExp(escapeRegex(location), "i"),
                isAvailable: true
            }).select("user").lean();
            filter.provider = { $in: profiles.map((profile) => profile.user) };
        } else {
            const availableProfiles = await ProviderProfile.find({ isAvailable: true }).select("user").lean();
            filter.provider = { $in: availableProfiles.map((profile) => profile.user) };
        }

        if (query) {
            const pattern = new RegExp(escapeRegex(query), "i");
            const [users, categories, profiles] = await Promise.all([
                User.find({ username: pattern }).select("_id").lean(),
                ServiceCategory.find({ name: pattern, isActive: true }).select("_id").lean(),
                ProviderProfile.find({ businessName: pattern, isAvailable: true }).select("user").lean()
            ]);
            filter.$or = [
                { name: pattern },
                { description: pattern },
                { category: { $in: categories.map((category) => category._id) } },
                { provider: { $in: [
                    ...users.map((user) => user._id),
                    ...profiles.map((profile) => profile.user)
                ] } }
            ];
        }

        const services = await Service.find(filter)
            .populate("category", "name description")
            .populate("provider", "username role")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        const providers = await ProviderProfile.find({
            user: { $in: [...new Set(services.map((service) => service.provider?._id?.toString()).filter(Boolean))] }
        }).select("user businessName location isAvailable").lean();
        const providerByUser = new Map(providers.map((profile) => [profile.user.toString(), profile]));
        const ratings = await Review.aggregate([
            { $match: { provider: { $in: providers.map((profile) => profile.user) } } },
            { $group: { _id: "$provider", average: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);
        const ratingByUser = new Map(ratings.map((rating) => [rating._id.toString(), {
            average: rating.average,
            count: rating.count
        }]));
        return res.json({
            services: services.map((service) => ({
                ...service,
                providerProfile: providerByUser.get(service.provider?._id?.toString()) || null,
                rating: ratingByUser.get(service.provider?._id?.toString()) || { average: 0, count: 0 }
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch services." });
    }
});

router.get("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid service id." });
    }
    try {
        const service = await Service.findOne({ _id: req.params.id, isActive: true })
            .populate("category", "name description")
            .populate("provider", "username role")
            .lean();
        if (!service) return res.status(404).json({ message: "Service not found." });
        const providerProfile = await ProviderProfile.findOne({
            user: service.provider._id,
            isAvailable: true
        }).select("businessName bio phone location isAvailable").lean();
        if (!providerProfile) return res.status(404).json({ message: "Service provider is not available." });
        return res.json({ service: { ...service, providerProfile } });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch service." });
    }
});

router.post("/", requireAuth, requireRole("provider"), async (req, res) => {
    const { updates, error } = sanitizeServicePayload(req.body || {});
    if (error) return res.status(400).json({ message: error });
    try {
        const category = await ServiceCategory.findOne({ _id: updates.category, isActive: true });
        if (!category) return res.status(404).json({ message: "Service category not found." });
        const profile = await ProviderProfile.findOne({ user: req.user.id, isAvailable: true });
        if (!profile) return res.status(409).json({ message: "Create an available provider profile before listing services." });

        const service = await Service.create({ ...updates, provider: req.user.id, isActive: true });
        return res.status(201).json({ message: "Service created successfully.", service });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create service." });
    }
});

router.patch("/:id", requireAuth, requireRole("provider"), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid service id." });
    }
    const { updates, error } = sanitizeServicePayload(req.body || {}, { partial: true });
    if (error) return res.status(400).json({ message: error });
    if (!Object.keys(updates).length) {
        return res.status(400).json({ message: "Provide at least one service field to update." });
    }

    try {
        if (updates.category) {
            const category = await ServiceCategory.findOne({ _id: updates.category, isActive: true });
            if (!category) return res.status(404).json({ message: "Service category not found." });
        }
        const service = await Service.findOneAndUpdate(
            { _id: req.params.id, provider: req.user.id },
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!service) return res.status(404).json({ message: "Your service listing was not found." });
        return res.json({ message: "Service updated successfully.", service });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update service." });
    }
});

router.delete("/:id", requireAuth, requireRole("provider"), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid service id." });
    }
    try {
        const service = await Service.findOneAndUpdate(
            { _id: req.params.id, provider: req.user.id, isActive: true },
            { $set: { isActive: false } },
            { new: true }
        );
        if (!service) return res.status(404).json({ message: "Your active service listing was not found." });
        return res.json({ message: "Service listing closed." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to close service listing." });
    }
});

module.exports = router;

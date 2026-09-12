const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");
const { requireAuth, requireRole } = require("../middleware/auth");

const sanitizeServicePayload = (payload = {}) => ({
    name: payload.name ? String(payload.name).trim() : "",
    description: payload.description ? String(payload.description).trim() : "",
    category: payload.category || "",
    price: Number(payload.price ?? 0),
    isActive: payload.isActive !== false
});

router.get("/service-categories", async (req, res) => {
    try {
        const categories = await ServiceCategory.find({ isActive: true }).sort({ name: 1 });
        return res.json({ categories });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch service categories." });
    }
});

router.get("/service-categories/:id", async (req, res) => {
    try {
        const category = await ServiceCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Service category not found." });
        }
        return res.json({ category });
    } catch (error) {
        return res.status(400).json({ message: "Invalid service category id." });
    }
});

router.get("/", async (req, res) => {
    try {
        const services = await Service.find({ isActive: true })
            .populate("category", "name description")
            .populate("provider", "username email role")
            .sort({ createdAt: -1 });

        return res.json({ services });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch services." });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate("category", "name description")
            .populate("provider", "username email role");

        if (!service) {
            return res.status(404).json({ message: "Service not found." });
        }

        return res.json({ service });
    } catch (error) {
        return res.status(400).json({ message: "Invalid service id." });
    }
});

router.post("/", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const payload = sanitizeServicePayload(req.body);

        if (!payload.name || !payload.description || !payload.category) {
            return res.status(400).json({ message: "Name, description, and category are required." });
        }

        const categoryExists = await ServiceCategory.findById(payload.category);
        if (!categoryExists) {
            return res.status(404).json({ message: "Service category not found." });
        }

        const newService = new Service({
            ...payload,
            provider: req.user.id
        });

        await newService.save();
        return res.status(201).json({ message: "Service created successfully.", service: newService });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create service." });
    }
});

router.patch("/:id", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service not found." });
        }

        if (service.provider.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to update this service." });
        }

        const updatedFields = sanitizeServicePayload({
            ...service.toObject(),
            ...req.body
        });

        if (!updatedFields.name || !updatedFields.description || !updatedFields.category) {
            return res.status(400).json({ message: "Name, description, and category are required." });
        }

        const categoryExists = await ServiceCategory.findById(updatedFields.category);
        if (!categoryExists) {
            return res.status(404).json({ message: "Service category not found." });
        }

        Object.assign(service, updatedFields);
        await service.save();

        return res.json({ message: "Service updated successfully.", service });
    } catch (error) {
        return res.status(400).json({ message: "Invalid service update request." });
    }
});

router.delete("/:id", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service not found." });
        }

        if (service.provider.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to delete this service." });
        }

        await service.deleteOne();
        return res.json({ message: "Service deleted successfully." });
    } catch (error) {
        return res.status(400).json({ message: "Invalid service id." });
    }
});

module.exports = router;

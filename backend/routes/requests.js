const express = require("express");
const router = express.Router();
const ServiceRequest = require("../models/ServiceRequest");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/mine", requireAuth, async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ customer: req.user.id }).sort({ createdAt: -1 });
        return res.json({ requests });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load your service requests." });
    }
});

router.get("/approved", requireAuth, async (req, res) => {
    try {
        const query = req.user.role === "provider"
            ? { provider: req.user.id, status: "accepted" }
            : { customer: req.user.id, status: "accepted" };

        const requests = await ServiceRequest.find(query).sort({ updatedAt: -1 });
        return res.json({ requests });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load approved requests." });
    }
});

router.get("/provider", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ provider: req.user.id }).sort({ createdAt: -1 });
        return res.json({ requests });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load provider requests." });
    }
});

router.post("/submit", requireAuth, async (req, res) => {
    try {
        const payload = {
            customer: req.user.id,
            category: String(req.body.category || "").trim(),
            serviceName: String(req.body.serviceName || "").trim(),
            providerName: String(req.body.providerName || "Local provider").trim(),
            message: String(req.body.message || "").trim(),
            preferredDate: String(req.body.preferredDate || "").trim(),
            preferredTime: String(req.body.preferredTime || "").trim()
        };

        if (!payload.category || !payload.serviceName || !payload.message) {
            return res.status(400).json({ message: "Category, service, and message are required." });
        }

        const request = await ServiceRequest.create(payload);
        return res.status(201).json({ message: "Service request submitted successfully.", request });
    } catch (error) {
        return res.status(500).json({ message: "Failed to submit service request." });
    }
});

router.patch("/:id/status", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        const status = String(req.body.status || "").trim();
        if (!["pending", "accepted", "rejected", "completed"].includes(status)) {
            return res.status(400).json({ message: "Invalid request status." });
        }

        request.status = status;
        request.provider = req.user.id;
        await request.save();
        return res.json({ message: "Request status updated.", request });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update request status." });
    }
});

module.exports = router;

const express = require("express");
const mongoose = require("mongoose");
const xss = require("xss");
const router = express.Router();
const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");
const ServiceRequest = require("../models/ServiceRequest");
const Review = require("../models/Review");
const LocationShare = require("../models/LocationShare");
const { requireAuth, requireRole } = require("../middleware/auth");
const { nextRequestStatus } = require("../lib/requestWorkflow");

const requestFields = [
    { path: "service", select: "name price currency priceUnit" },
    { path: "customer", select: "username phone" },
    { path: "provider", select: "username" }
];

async function presentRequests(requests) {
    if (!requests.length) return [];
    const [reviewed, profiles] = await Promise.all([
        Review.find({ request: { $in: requests.map((request) => request._id) } }).select("request").lean(),
        ProviderProfile.find({
            user: { $in: requests.map((request) => request.provider?._id).filter(Boolean) }
        }).select("user businessName").lean()
    ]);
    const reviewedIds = new Set(reviewed.map((review) => review.request.toString()));
    const names = new Map(profiles.map((profile) => [profile.user.toString(), profile.businessName]));
    return requests.map((request) => ({
        ...request,
        hasReview: reviewedIds.has(request._id.toString()),
        providerName: request.provider
            ? names.get(request.provider._id.toString()) || request.provider.username || request.providerName
            : request.providerName
    }));
}

router.get("/mine", requireAuth, requireRole("customer"), async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ customer: req.user.id })
            .populate(requestFields)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        return res.json({ requests: await presentRequests(requests) });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load your service requests." });
    }
});

router.get("/approved", requireAuth, async (req, res) => {
    try {
        const query = req.user.role === "provider"
            ? { provider: req.user.id, status: { $in: ["accepted", "in_progress"] } }
            : { customer: req.user.id, status: { $in: ["accepted", "in_progress"] } };
        const requests = await ServiceRequest.find(query).sort({ updatedAt: -1 });
        return res.json({ requests });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load approved requests." });
    }
});

router.get("/provider", requireAuth, requireRole("provider"), async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ provider: req.user.id })
            .populate(requestFields)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        return res.json({ requests: await presentRequests(requests) });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load provider requests." });
    }
});

router.post("/submit", requireAuth, requireRole("customer"), async (req, res) => {
    const serviceId = String(req.body?.serviceId || "");
    const message = xss(String(req.body?.message || "")).trim();
    const preferredDate = String(req.body?.preferredDate || "").trim();
    const preferredTime = String(req.body?.preferredTime || "").trim();
    const location = xss(String(req.body?.location || "")).trim();

    if (!mongoose.isValidObjectId(serviceId)) {
        return res.status(400).json({ message: "Choose an available service listing before sending a request." });
    }
    if (message.length < 10 || message.length > 2000) {
        return res.status(400).json({ message: "Project details must be between 10 and 2,000 characters." });
    }
    if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
        return res.status(400).json({ message: "Choose a valid preferred date." });
    }
    if (preferredTime && !/^\d{2}:\d{2}$/.test(preferredTime)) {
        return res.status(400).json({ message: "Choose a valid preferred time." });
    }
    if (location.length > 120) {
        return res.status(400).json({ message: "Location must be 120 characters or fewer." });
    }

    try {
        const service = await Service.findOne({ _id: serviceId, isActive: true })
            .populate("category", "name")
            .lean();
        if (!service) return res.status(404).json({ message: "This service listing is no longer available." });
        const profile = await ProviderProfile.findOne({ user: service.provider, isAvailable: true }).lean();
        if (!profile) return res.status(409).json({ message: "This provider is not accepting requests right now." });

        const request = await ServiceRequest.create({
            customer: req.user.id,
            provider: service.provider,
            service: service._id,
            providerName: profile.businessName,
            category: service.category.name,
            serviceName: service.name,
            message,
            preferredDate,
            preferredTime,
            location: location || profile.location,
            history: [{
                actor: req.user.id,
                recipient: service.provider,
                actorRole: "customer",
                eventType: "request_created",
                toStatus: "pending",
                note: "Request submitted."
            }]
        });
        return res.status(201).json({ message: "Service request submitted successfully.", request });
    } catch (error) {
        return res.status(500).json({ message: "Failed to submit service request." });
    }
});

router.patch("/:id/status", requireAuth, requireRole("provider"), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid request id." });
    }
    const statusActions = {
        accepted: "accept",
        rejected: "reject",
        in_progress: "start",
        completed: "complete"
    };
    const action = statusActions[String(req.body?.status || "").trim()];
    if (!action) {
        return res.status(400).json({ message: "Choose an allowed request status." });
    }

    try {
        const current = await ServiceRequest.findOne({ _id: req.params.id, provider: req.user.id });
        if (!current) return res.status(404).json({ message: "Customer request not found." });
        const nextStatus = nextRequestStatus(current.status, action);
        if (!nextStatus) {
            return res.status(409).json({ message: "That request status change is not allowed." });
        }
        const request = await ServiceRequest.findOneAndUpdate({
            _id: current._id,
            provider: req.user.id,
            status: current.status
        }, {
            $set: { status: nextStatus },
            $push: {
                history: {
                    actor: req.user.id,
                    recipient: current.customer,
                    actorRole: "provider",
                    eventType: "request_status",
                    fromStatus: current.status,
                    toStatus: nextStatus,
                    note: `Provider changed request status to ${nextStatus}.`
                }
            }
        }, { new: true, runValidators: true });
        if (!request) return res.status(409).json({ message: "This request changed. Refresh and try again." });
        const remainingActive = await ServiceRequest.exists({
            provider: req.user.id,
            status: { $in: ["accepted", "in_progress"] }
        });
        if (!remainingActive) {
            await LocationShare.updateOne({ provider: req.user.id }, { $set: { sharingActive: false } });
        }
        return res.json({ message: "Request status updated.", request });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update request status." });
    }
});

router.post("/:id/cancel", requireAuth, requireRole("customer"), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid request id." });
    }
    try {
        const current = await ServiceRequest.findOne({
            _id: req.params.id,
            customer: req.user.id,
            status: { $in: ["pending", "accepted"] }
        }).select("status provider");
        if (!current) {
            return res.status(409).json({ message: "This request cannot be found or has already started." });
        }
        const request = await ServiceRequest.findOneAndUpdate({
            _id: req.params.id,
            customer: req.user.id,
            status: current.status
        }, {
            $set: { status: "cancelled" },
            $push: {
                history: {
                    actor: req.user.id,
                    recipient: current.provider,
                    actorRole: "customer",
                    eventType: "request_status",
                    fromStatus: current.status,
                    toStatus: "cancelled",
                    note: "Customer cancelled the request."
                }
            }
        }, { new: true, runValidators: true });
        if (!request) return res.status(409).json({ message: "This request changed. Refresh and try again." });
        const remainingActive = await ServiceRequest.exists({
            provider: request.provider,
            status: { $in: ["accepted", "in_progress"] }
        });
        if (!remainingActive) {
            await LocationShare.updateOne({ provider: request.provider }, { $set: { sharingActive: false } });
        }
        return res.json({ message: "Service request cancelled.", request });
    } catch (error) {
        return res.status(500).json({ message: "Failed to cancel service request." });
    }
});

router.post("/:id/review", requireAuth, requireRole("customer"), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid request id." });
    }
    const rating = Number(req.body?.rating);
    const comment = xss(String(req.body?.comment || "")).trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 1200) {
        return res.status(400).json({ message: "Choose a rating from 1 to 5 and keep the review under 1,200 characters." });
    }

    try {
        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            customer: req.user.id,
            status: "completed",
            provider: { $ne: null },
            service: { $ne: null }
        });
        if (!request) {
            return res.status(409).json({ message: "Only a completed service can be reviewed." });
        }
        const review = await Review.create({
            request: request._id,
            customer: request.customer,
            provider: request.provider,
            service: request.service,
            rating,
            comment
        });
        return res.status(201).json({ message: "Review submitted successfully.", review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "You have already reviewed this completed service." });
        }
        return res.status(500).json({ message: "Failed to submit review." });
    }
});

module.exports = router;

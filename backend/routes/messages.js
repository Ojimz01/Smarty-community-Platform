const express = require("express");
const mongoose = require("mongoose");
const xss = require("xss");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const Message = require("../models/Message");
const ServiceRequest = require("../models/ServiceRequest");
const { requireAuth } = require("../middleware/auth");
const { getMessageRecipient } = require("../lib/messages");

const sendMessageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many messages sent. Please try again later." }
});

router.get("/:requestId", requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.requestId)) {
        return res.status(400).json({ message: "Invalid request id." });
    }

    try {
        const request = await ServiceRequest.findById(req.params.requestId)
            .select("customer provider")
            .lean();
        if (!request || !getMessageRecipient(request, req.user.id)) {
            return res.status(404).json({ message: "Conversation not found." });
        }

        await Message.updateMany(
            { request: request._id, recipient: req.user.id, readAt: null },
            { $set: { readAt: new Date() } }
        );
        const messages = await Message.find({ request: request._id })
            .select("sender recipient body readAt createdAt")
            .sort({ createdAt: 1 })
            .limit(200)
            .lean();
        return res.json({ messages });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load conversation." });
    }
});

router.post("/:requestId", requireAuth, sendMessageLimiter, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.requestId)) {
        return res.status(400).json({ message: "Invalid request id." });
    }
    const body = xss(String(req.body?.body || "")).trim();
    if (!body || body.length > 2000) {
        return res.status(400).json({ message: "Message must be between 1 and 2,000 characters." });
    }

    try {
        const request = await ServiceRequest.findById(req.params.requestId)
            .select("customer provider")
            .lean();
        const recipient = request && getMessageRecipient(request, req.user.id);
        if (!request || !recipient) {
            return res.status(404).json({ message: "Conversation not found." });
        }

        const message = await Message.create({
            request: request._id,
            sender: req.user.id,
            recipient,
            body
        });
        return res.status(201).json({ message: "Message sent.", conversationMessage: message });
    } catch (error) {
        return res.status(500).json({ message: "Failed to send message." });
    }
});

module.exports = router;

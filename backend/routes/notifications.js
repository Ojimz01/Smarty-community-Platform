const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Notification = require("../models/Notification");
const ServiceRequest = require("../models/ServiceRequest");
const Review = require("../models/Review");
const Message = require("../models/Message");
const { requireAuth } = require("../middleware/auth");

async function materializeNotifications(userId) {
    const [events, reviews, messages] = await Promise.all([
        ServiceRequest.aggregate([
            { $match: { "history.recipient": new mongoose.Types.ObjectId(userId) } },
            { $unwind: "$history" },
            { $match: { "history.recipient": new mongoose.Types.ObjectId(userId) } },
            { $sort: { "history.createdAt": -1 } },
            { $limit: 100 },
            {
                $project: {
                    request: "$_id",
                    serviceName: 1,
                    event: "$history"
                }
            }
        ]),
        Review.find({ provider: userId })
            .populate("service", "name")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean(),
        Message.find({ recipient: userId })
            .populate("request", "serviceName")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean()
    ]);

    const records = [
        ...events.map(({ request, serviceName, event }) => ({
            recipient: userId,
            type: event.eventType,
            title: event.eventType === "request_created" ? "New service request" : `Request ${event.toStatus.replace("_", " ")}`,
            body: event.eventType === "request_created"
                ? `A customer requested ${serviceName}.`
                : `${serviceName} is now ${event.toStatus.replace("_", " ")}.`,
            request,
            sourceKey: `request:${request}:event:${event._id}`,
            readAt: null
        })),
        ...reviews.map((review) => ({
            recipient: userId,
            type: "new_review",
            title: "New customer review",
            body: `A customer left a ${review.rating}-star review for ${review.service?.name || "your service"}.`,
            request: review.request,
            sourceKey: `review:${review._id}`,
            readAt: null
        })),
        ...messages.map((message) => ({
            recipient: userId,
            type: "new_message",
            title: "New message",
            body: `You received a message about ${message.request?.serviceName || "your service request"}.`,
            request: message.request?._id || null,
            message: message._id,
            sourceKey: `message:${message._id}`,
            readAt: null
        }))
    ];

    if (records.length) {
        try {
            await Notification.bulkWrite(records.map((record) => ({
                updateOne: {
                    filter: { sourceKey: record.sourceKey },
                    update: { $setOnInsert: record },
                    upsert: true
                }
            })), { ordered: false });
        } catch (error) {
            const writeErrors = error.writeErrors || [];
            if (!writeErrors.length || writeErrors.some((writeError) => writeError.code !== 11000)) {
                throw error;
            }
        }
    }
}

router.get("/mine", requireAuth, async (req, res) => {
    try {
        await materializeNotifications(req.user.id);
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ recipient: req.user.id })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
            Notification.countDocuments({ recipient: req.user.id, readAt: null })
        ]);
        return res.json({ notifications, unreadCount });
    } catch (error) {
        return res.status(500).json({ message: "Failed to load notifications." });
    }
});

router.patch("/mine/read-all", requireAuth, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req.user.id, readAt: null },
            { $set: { readAt: new Date() } }
        );
        return res.json({ message: "Notifications marked as read.", modifiedCount: result.modifiedCount });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update notifications." });
    }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid notification id." });
    }
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { $set: { readAt: new Date() } },
            { new: true }
        ).lean();
        if (!notification) return res.status(404).json({ message: "Notification not found." });
        return res.json({ notification });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update notification." });
    }
});

module.exports = router;

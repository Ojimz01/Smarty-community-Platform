const mongoose = require("mongoose");

const ServiceRequestSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        default: null
    },
    providerName: {
        type: String,
        default: "Local provider",
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    serviceName: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    preferredDate: {
        type: String,
        default: ""
    },
    preferredTime: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        trim: true,
        maxlength: 120,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "in_progress", "completed", "cancelled"],
        default: "pending",
        index: true
    },
    history: [{
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        actorRole: { type: String, enum: ["customer", "provider", "admin"], required: true },
        eventType: { type: String, enum: ["request_created", "request_status"], required: true },
        fromStatus: { type: String, default: "" },
        toStatus: { type: String, required: true },
        note: { type: String, trim: true, maxlength: 300, default: "" },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

ServiceRequestSchema.index({ customer: 1, createdAt: -1 });
ServiceRequestSchema.index({ provider: 1, status: 1, createdAt: -1 });
ServiceRequestSchema.index({ "history.recipient": 1 });

module.exports = mongoose.model("ServiceRequest", ServiceRequestSchema);

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
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "completed"],
        default: "pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ServiceRequest", ServiceRequestSchema);

const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ["request_created", "request_status", "new_message", "new_review", "verification_status"],
        required: true
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest", default: null },
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    sourceKey: { type: String, required: true, unique: true },
    readAt: { type: Date, default: null }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);

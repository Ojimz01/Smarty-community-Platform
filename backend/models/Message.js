const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceRequest",
        required: true,
        index: true
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: { type: Date, default: null }
}, { timestamps: true });

MessageSchema.index({ request: 1, createdAt: 1 });
MessageSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);

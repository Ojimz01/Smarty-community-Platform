const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceCategory",
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    currency: {
        type: String,
        uppercase: true,
        match: /^[A-Z]{3}$/,
        default: "USD"
    },
    priceUnit: {
        type: String,
        enum: ["fixed", "hour", "visit"],
        default: "fixed"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

ServiceSchema.index({ category: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Service", ServiceSchema);

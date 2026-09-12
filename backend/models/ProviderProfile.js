const mongoose = require("mongoose");

const ProviderProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    bio: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ProviderProfile", ProviderProfileSchema);

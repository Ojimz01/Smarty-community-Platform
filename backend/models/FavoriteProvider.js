const mongoose = require("mongoose");

const FavoriteProviderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

FavoriteProviderSchema.index({ customer: 1, provider: 1 }, { unique: true });
FavoriteProviderSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model("FavoriteProvider", FavoriteProviderSchema);

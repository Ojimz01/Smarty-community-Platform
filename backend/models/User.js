const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true },
    password: { type: String, required: true, select: false },
    role: {
        type: String,
        enum: ["customer", "provider", "admin"],
        default: "customer"
    },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    location: { type: String, trim: true, maxlength: 120, default: "" }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", UserSchema);
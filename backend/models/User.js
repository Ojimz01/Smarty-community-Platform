const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: {
        type: String,
        enum: ["customer", "provider", "admin"],
        default: "customer"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", UserSchema);
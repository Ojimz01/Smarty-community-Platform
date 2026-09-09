const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

//REGISTER
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const extistingUser = await User.findOne({ email});

        if(extistingUser) {
            return res.json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.json({ message: "User registered successfully" });
    } catch(err) {
        res.status(500).json({ message: "Error registering user"});
    }
});


const jwt = require("jsonwebtoken");
require('dotenv').config();
//LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user){
            return res.json({ message: "User not found"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ message: "Invalid credentials"});
        }

        // Create Token
        const secret = process.env.JWT_SECRET || "secretkey123";
        const token = jwt.sign({ email: user.email }, secret, { expiresIn: "1h" });

        res.json({ 
            message: "Login successful", 
            token:token
         });
    } catch (err) {
        res.status(500).json({ message: "Error logging in" });
    }
});

module.exports = router;
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

const requireAuth = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    return res.status(500).json({ message: "Server authentication is not securely configured." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  if (!decoded || !decoded.id) {
    return res.status(401).json({ message: "Invalid token payload." });
  }

  let user;
  try {
    user = await User.findById(decoded.id).select("-password");
  } catch (error) {
    return res.status(503).json({ message: "Authentication service is temporarily unavailable." });
  }

  if (!user) {
    return res.status(401).json({ message: "User not found." });
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    role: user.role || "customer"
  };

  return next();
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied." });
  }

  return next();
};

module.exports = {
  requireAuth,
  requireRole
};

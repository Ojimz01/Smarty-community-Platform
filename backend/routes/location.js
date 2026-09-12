const express = require("express");
const router = express.Router();
const LocationShare = require("../models/LocationShare");
const ServiceRequest = require("../models/ServiceRequest");
const { requireAuth, requireRole } = require("../middleware/auth");

const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return false;
  }

  if (latitude < -90 || latitude > 90) {
    return false;
  }

  if (longitude < -180 || longitude > 180) {
    return false;
  }

  return true;
};

router.post("/start", requireAuth, requireRole("provider"), async (req, res) => {
  try {
    const { latitude, longitude } = req.body || {};

    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    const approvedRequest = await ServiceRequest.findOne({
      provider: req.user.id,
      status: "accepted"
    });

    if (!approvedRequest) {
      return res.status(403).json({ message: "You can only share live location for an accepted service request." });
    }

    let share = await LocationShare.findOne({ provider: req.user.id });

    if (!share) {
      share = new LocationShare({
        provider: req.user.id,
        latitude,
        longitude,
        sharingActive: true,
        updatedAt: new Date()
      });
    } else {
      share.latitude = latitude;
      share.longitude = longitude;
      share.sharingActive = true;
      share.updatedAt = new Date();
    }

    await share.save();

    return res.json({
      message: "Location sharing started.",
      location: {
        provider: share.provider,
        latitude: share.latitude,
        longitude: share.longitude,
        sharingActive: share.sharingActive,
        updatedAt: share.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to start location sharing." });
  }
});

router.post("/update", requireAuth, requireRole("provider"), async (req, res) => {
  try {
    const { latitude, longitude } = req.body || {};

    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    const approvedRequest = await ServiceRequest.findOne({
      provider: req.user.id,
      status: "accepted"
    });

    if (!approvedRequest) {
      return res.status(403).json({ message: "Location updates are only allowed for accepted service requests." });
    }

    let share = await LocationShare.findOne({ provider: req.user.id });

    if (!share) {
      return res.status(404).json({ message: "Location sharing has not been started." });
    }

    share.latitude = latitude;
    share.longitude = longitude;
    share.sharingActive = true;
    share.updatedAt = new Date();

    await share.save();

    return res.json({
      message: "Location updated successfully.",
      location: {
        provider: share.provider,
        latitude: share.latitude,
        longitude: share.longitude,
        sharingActive: share.sharingActive,
        updatedAt: share.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update location." });
  }
});

router.post("/stop", requireAuth, requireRole("provider"), async (req, res) => {
  try {
    const share = await LocationShare.findOne({ provider: req.user.id });

    if (!share) {
      return res.status(404).json({ message: "No active location sharing found." });
    }

    share.sharingActive = false;
    share.updatedAt = new Date();
    await share.save();

    return res.json({
      message: "Location sharing stopped.",
      location: {
        provider: share.provider,
        latitude: share.latitude,
        longitude: share.longitude,
        sharingActive: share.sharingActive,
        updatedAt: share.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to stop location sharing." });
  }
});

router.get("/provider/:id", requireAuth, async (req, res) => {
  try {
    const share = await LocationShare.findOne({ provider: req.params.id, sharingActive: true })
      .populate("provider", "username email role");

    if (!share) {
      return res.status(404).json({ message: "Location not currently shared." });
    }

    if (req.user.role === "provider" && req.user.id !== req.params.id) {
      return res.status(403).json({ message: "You can only view your own active location." });
    }

    if (req.user.role === "customer") {
      const approvedRequest = await ServiceRequest.findOne({
        provider: req.params.id,
        customer: req.user.id,
        status: "accepted"
      });

      if (!approvedRequest) {
        return res.status(403).json({ message: "Location access is restricted to an active service relationship." });
      }

      return res.json({
        location: {
          provider: share.provider,
          latitude: share.latitude,
          longitude: share.longitude,
          sharingActive: share.sharingActive,
          updatedAt: share.updatedAt,
          serviceRequestId: approvedRequest._id
        }
      });
    }

    if (req.user.role === "admin") {
      return res.json({
        location: {
          provider: share.provider,
          latitude: share.latitude,
          longitude: share.longitude,
          sharingActive: share.sharingActive,
          updatedAt: share.updatedAt
        }
      });
    }

    return res.status(403).json({ message: "Location access denied." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch location." });
  }
});

module.exports = router;

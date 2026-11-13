const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");
const FavoriteProvider = require("../models/FavoriteProvider");

const secret = "test-jwt-secret-that-is-long-enough-123";
process.env.JWT_SECRET = secret;

const originals = {
    findById: User.findById,
    findOne: User.findOne,
    findProfile: ProviderProfile.findOne,
    updateFavorite: FavoriteProvider.updateOne
};

let server;
let baseUrl;
let favoriteFilter;

test.before(async () => {
    User.findById = (id) => ({
        select: async () => ({ _id: id, role: String(id) === "provider-account" ? "provider" : "customer" })
    });
    User.findOne = (filter) => ({
        select() {
            return this;
        },
        lean: async () => filter.role === "provider" ? { _id: filter._id } : null
    });
    ProviderProfile.findOne = () => ({
        select() {
            return this;
        },
        lean: async () => ({ _id: "provider-profile" })
    });
    FavoriteProvider.updateOne = async (filter) => {
        favoriteFilter = filter;
        return { acknowledged: true };
    };

    const app = express();
    app.use(express.json());
    app.use("/api/favorites", require("../routes/favorites"));
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    User.findById = originals.findById;
    User.findOne = originals.findOne;
    ProviderProfile.findOne = originals.findProfile;
    FavoriteProvider.updateOne = originals.updateFavorite;
});

test("customer favorite writes are scoped to the authenticated customer", async () => {
    const providerId = "507f1f77bcf86cd799439011";
    const token = jwt.sign({ id: "customer-account", role: "customer" }, secret);
    const response = await fetch(`${baseUrl}/api/favorites/${providerId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ customer: "another-customer" })
    });

    assert.equal(response.status, 200);
    assert.deepEqual(favoriteFilter, {
        customer: "customer-account",
        provider: providerId
    });
});

test("provider roles cannot use customer favorites", async () => {
    const token = jwt.sign({ id: "provider-account", role: "provider" }, secret);
    const response = await fetch(`${baseUrl}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 403);
});

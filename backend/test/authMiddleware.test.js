const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const secret = "auth-middleware-test-secret-at-least-32";
process.env.JWT_SECRET = secret;

const originalFindById = User.findById;

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test.after(() => {
    User.findById = originalFindById;
});

test("database failures are reported as service unavailable, not invalid credentials", async () => {
    User.findById = () => ({
        select: async () => {
            throw new Error("database unavailable");
        }
    });
    const req = {
        headers: {
            authorization: `Bearer ${jwt.sign({ id: "customer-account" }, secret)}`
        }
    };
    const res = createResponse();
    let nextCalled = false;

    await requireAuth(req, res, () => {
        nextCalled = true;
    });

    assert.equal(res.statusCode, 503);
    assert.equal(res.body.message, "Authentication service is temporarily unavailable.");
    assert.equal(nextCalled, false);
});

test("invalid bearer tokens remain unauthorized", async () => {
    const req = { headers: { authorization: "Bearer invalid-token" } };
    const res = createResponse();

    await requireAuth(req, res, () => assert.fail("next should not be called"));

    assert.equal(res.statusCode, 401);
});

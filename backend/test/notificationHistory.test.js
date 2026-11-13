const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const ServiceRequest = require("../models/ServiceRequest");

test("request history requires a recipient so notification events are addressable", async () => {
    const actor = new mongoose.Types.ObjectId();
    const recipient = new mongoose.Types.ObjectId();
    const request = new ServiceRequest({
        customer: actor,
        provider: recipient,
        category: "Plumbing",
        serviceName: "Pipe repair",
        message: "Please repair a leaking pipe.",
        history: [{
            actor,
            recipient,
            actorRole: "customer",
            eventType: "request_created",
            toStatus: "pending"
        }]
    });

    await assert.doesNotReject(request.validate());
    request.history[0].recipient = undefined;
    await assert.rejects(request.validate(), (error) => Boolean(error.errors["history.0.recipient"]));
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { nextRequestStatus } = require("../lib/requestWorkflow");

test("provider can accept or reject a pending request", () => {
    assert.equal(nextRequestStatus("pending", "accept"), "accepted");
    assert.equal(nextRequestStatus("pending", "reject"), "rejected");
});

test("accepted requests progress to in progress and then complete", () => {
    assert.equal(nextRequestStatus("accepted", "start"), "in_progress");
    assert.equal(nextRequestStatus("in_progress", "complete"), "completed");
});

test("completed or rejected requests cannot be transitioned again", () => {
    assert.equal(nextRequestStatus("completed", "start"), undefined);
    assert.equal(nextRequestStatus("rejected", "accept"), undefined);
    assert.equal(nextRequestStatus("pending", "complete"), undefined);
});

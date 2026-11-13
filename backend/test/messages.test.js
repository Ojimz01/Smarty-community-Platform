const test = require("node:test");
const assert = require("node:assert/strict");
const { getMessageRecipient } = require("../lib/messages");

test("only request participants can address messages to the other participant", () => {
    const request = { customer: "customer-1", provider: "provider-1" };

    assert.equal(getMessageRecipient(request, "customer-1"), "provider-1");
    assert.equal(getMessageRecipient(request, "provider-1"), "customer-1");
    assert.equal(getMessageRecipient(request, "stranger"), null);
});

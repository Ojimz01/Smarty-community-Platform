const test = require("node:test");
const assert = require("node:assert/strict");
const { validatePasswordChange } = require("../lib/passwordChange");

test("password changes require the current password", () => {
    assert.deepEqual(validatePasswordChange({ currentPassword: "", newPassword: "new-secret" }), {
        error: "Enter your current password."
    });
});

test("password changes enforce length limits", () => {
    assert.match(validatePasswordChange({ currentPassword: "old-secret", newPassword: "short" }).error, /between 6 and 128/);
    assert.match(validatePasswordChange({ currentPassword: "old-secret", newPassword: "x".repeat(129) }).error, /between 6 and 128/);
});

test("password changes reject reusing the current password", () => {
    assert.match(validatePasswordChange({ currentPassword: "same-secret", newPassword: "same-secret" }).error, /different/);
});

test("valid password changes are accepted", () => {
    assert.deepEqual(validatePasswordChange({ currentPassword: "old-secret", newPassword: "new-secret" }), { ok: true });
});

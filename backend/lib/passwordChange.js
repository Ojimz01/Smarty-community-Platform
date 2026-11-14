function validatePasswordChange({ currentPassword, newPassword } = {}) {
    if (typeof currentPassword !== "string" || !currentPassword) {
        return { error: "Enter your current password." };
    }
    if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 128) {
        return { error: "The new password must be between 6 and 128 characters." };
    }
    if (currentPassword === newPassword) {
        return { error: "Choose a new password that is different from your current one." };
    }
    return { ok: true };
}

module.exports = { validatePasswordChange };

function getMessageRecipient(request, userId) {
    const participantId = String(userId);
    if (String(request.customer) === participantId) return request.provider || null;
    if (String(request.provider) === participantId) return request.customer || null;
    return null;
}

module.exports = { getMessageRecipient };

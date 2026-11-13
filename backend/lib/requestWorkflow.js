const transitions = Object.freeze({
    pending: Object.freeze({ accept: "accepted", reject: "rejected" }),
    accepted: Object.freeze({ start: "in_progress" }),
    in_progress: Object.freeze({ complete: "completed" })
});

function nextRequestStatus(status, action) {
    return transitions[status] && transitions[status][action];
}

module.exports = { nextRequestStatus };

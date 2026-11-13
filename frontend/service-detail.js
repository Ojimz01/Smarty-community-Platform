const SERVICE_API_BASE = (() => {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return isLocal ? "http://localhost:5000/api" : `${window.location.origin}/api`;
})();

const serviceDetailStatus = document.getElementById("serviceDetailStatus");
const serviceDetailContent = document.getElementById("serviceDetailContent");
const detailRequestForm = document.getElementById("detailRequestForm");
const detailRequestSubmit = document.getElementById("detailRequestSubmit");
const detailRequestFeedback = document.getElementById("detailRequestFeedback");
let activeServiceId = "";
let serviceIsAvailable = false;

function escapeServiceText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

async function readServiceResponse(response) {
    const body = await response.text();
    try {
        return body ? JSON.parse(body) : {};
    } catch (error) {
        throw new Error(`The service API returned an invalid response (HTTP ${response.status}).`);
    }
}

async function loadServiceDetails() {
    const params = new URLSearchParams(window.location.search);
    activeServiceId = params.get("id") || "";
    if (!/^[a-f\d]{24}$/i.test(activeServiceId)) {
        serviceDetailStatus.innerHTML = "Choose a service listing from the <a href=\"services.html\">marketplace</a> to view its details.";
        return;
    }

    try {
        const response = await fetch(`${SERVICE_API_BASE}/services/${encodeURIComponent(activeServiceId)}`);
        const data = await readServiceResponse(response);
        if (!response.ok) throw new Error(data.message || "This service listing is unavailable.");
        const service = data.service;
        const profile = service.providerProfile;
        if (!profile || !service.provider) throw new Error("Provider details are unavailable for this listing.");

        serviceIsAvailable = Boolean(profile.isAvailable);
        document.title = `${service.name} | Smart Community`;
        document.getElementById("detailBreadcrumb").textContent = service.name;
        document.getElementById("detailCategory").textContent = service.category?.name || "Local service";
        document.getElementById("detailName").textContent = service.name;
        document.getElementById("detailDescription").textContent = service.description;
        document.getElementById("detailProvider").textContent = profile.businessName || service.provider.username || "Local provider";
        document.getElementById("detailLocation").textContent = profile.location || "Location not listed";

        const ratingResponse = await fetch(`${SERVICE_API_BASE}/providers/${encodeURIComponent(profile._id)}`);
        const ratingData = await readServiceResponse(ratingResponse);
        if (!ratingResponse.ok) throw new Error(ratingData.message || "Provider rating is unavailable.");
        const count = Number(ratingData.rating?.count || 0);
        const average = Number(ratingData.rating?.average || 0);
        document.getElementById("detailRating").textContent = count
            ? `${average.toFixed(1)} / 5 (${count} ${count === 1 ? "review" : "reviews"})`
            : "No reviews yet";
        const reviews = ratingData.reviews || [];
        document.getElementById("detailReviews").innerHTML = reviews.length
            ? reviews.map((review) => `<li><strong>${escapeServiceText(review.rating)} / 5 · ${escapeServiceText(review.customerName)}</strong><p>${escapeServiceText(review.comment || "No written comment.")}</p></li>`).join("")
            : "<li>No customer reviews yet.</li>";
        document.getElementById("detailAvailability").textContent = serviceIsAvailable
            ? "Accepting requests"
            : "Not accepting requests";
        const price = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: service.currency || "USD"
        }).format(Number(service.price || 0));
        document.getElementById("detailPrice").textContent = `${price} / ${service.priceUnit || "fixed"}`;

        detailRequestSubmit.disabled = !serviceIsAvailable;
        if (!serviceIsAvailable) {
            detailRequestFeedback.textContent = "This provider is not accepting new requests right now.";
        }

        serviceDetailStatus.classList.add("hidden");
        serviceDetailContent.classList.remove("hidden");
    } catch (error) {
        serviceDetailStatus.innerHTML = `${escapeServiceText(error.message || "Unable to load this service listing.")} <a href="services.html">Browse other services</a>`;
    }
}

detailRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    let payload;
    try {
        const normalized = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
        if (decoded.role !== "customer") {
            detailRequestFeedback.textContent = "Only customer accounts can request services.";
            return;
        }
    } catch (error) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    if (!serviceIsAvailable || !activeServiceId) {
        detailRequestFeedback.textContent = "This service cannot accept a request right now.";
        return;
    }

    const formData = new FormData(detailRequestForm);
    payload = {
        serviceId: activeServiceId,
        location: String(formData.get("location") || "").trim(),
        preferredDate: String(formData.get("preferredDate") || ""),
        preferredTime: String(formData.get("preferredTime") || ""),
        message: String(formData.get("message") || "").trim()
    };
    if (payload.message.length < 10 || payload.message.length > 2000) {
        detailRequestFeedback.textContent = "Describe the work in 10 to 2,000 characters.";
        return;
    }

    detailRequestSubmit.disabled = true;
    detailRequestFeedback.textContent = "Sending your service request...";
    try {
        const response = await fetch(`${SERVICE_API_BASE}/requests/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await readServiceResponse(response);
        if (!response.ok) throw new Error(data.message || "Unable to submit your service request.");
        detailRequestFeedback.textContent = `${data.message || "Service request sent."} You can track it from your dashboard.`;
        detailRequestForm.reset();
    } catch (error) {
        detailRequestFeedback.textContent = error.message || "Unable to submit your service request.";
    } finally {
        detailRequestSubmit.disabled = !serviceIsAvailable;
    }
});

loadServiceDetails();

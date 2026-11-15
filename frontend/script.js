const API_BASE = (() => {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return isLocal ? "http://localhost:5000/api" : `${window.location.origin}/api`;
})();

const API_URL = `${API_BASE}/auth`;

function friendlyApiError(error, fallback = "Something went wrong. Please try again.") {
    const message = String(error?.message || "").trim();
    if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
        return "We can't reach the service right now. Check your connection and try again.";
    }
    return message || fallback;
}

async function checkApiAvailability() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(`${API_BASE}/health`, {
            signal: controller.signal,
            cache: "no-store"
        });
        return response.ok;
    } catch (error) {
        return false;
    } finally {
        window.clearTimeout(timeout);
    }
}

async function showServiceAvailabilityNotice(target) {
    if (!target) return;
    if (await checkApiAvailability()) return;
    const notice = document.createElement("div");
    notice.className = "service-notice";
    notice.setAttribute("role", "status");
    notice.innerHTML = "<strong>Account services are offline right now.</strong><span>Browsing works, but sign-in, service requests, and dashboards need the Smart Community API. Please try again shortly.</span>";
    target.prepend(notice);
}

async function parseApiResponse(response) {
    const body = await response.text();
    try {
        return body ? JSON.parse(body) : {};
    } catch (error) {
        const status = response.status ? ` (HTTP ${response.status})` : "";
        throw new Error(`The API returned an invalid response${status}.`);
    }
}

// ===== Mobile Menu Toggle =====
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const mainNav = document.getElementById("mainNav");

if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener("click", () => {
        const isActive = mainNav.classList.toggle("active");
        mobileMenuToggle.setAttribute("aria-expanded", isActive);
    });

    // Close menu when a link is clicked
    mainNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            mainNav.classList.remove("active");
            mobileMenuToggle.setAttribute("aria-expanded", false);
        });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest("header")) {
            mainNav.classList.remove("active");
            mobileMenuToggle.setAttribute("aria-expanded", false);
        }
    });

    // Allow keyboard users to open/close menu via Enter/Space on toggle
    mobileMenuToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const isActive = mainNav.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', isActive);
        }
    });
}

// ===== Form Validation Helpers =====
function showError(inputId, errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = message ? "block" : "none";
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(fields) {
    let isValid = true;
    fields.forEach(field => {
        if (!field.value.trim()) {
            showError(field.id, `${field.id}-error`, "This field is required");
            isValid = false;
        } else {
            showError(field.id, `${field.id}-error`, "");
        }
    });
    return isValid;
}

// ===== Register Form =====
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const registerBtn = document.getElementById("registerBtn");
    const registerSpinner = document.getElementById("registerSpinner");

    // Real-time validation
    usernameInput?.addEventListener("blur", () => {
        const value = usernameInput.value.trim();
        if (value && value.length < 3) {
            showError("username", "username-error", "Username must be at least 3 characters");
        } else {
            showError("username", "username-error", "");
        }
    });

    emailInput?.addEventListener("blur", () => {
        const value = emailInput.value.trim();
        if (value && !validateEmail(value)) {
            showError("email", "email-error", "Please enter a valid email");
        } else {
            showError("email", "email-error", "");
        }
    });

    passwordInput?.addEventListener("blur", () => {
        const value = passwordInput.value;
        if (value && value.length < 6) {
            showError("password", "password-error", "Password must be at least 6 characters");
        } else {
            showError("password", "password-error", "");
        }
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fields = [usernameInput, emailInput, passwordInput].filter(f => f);
        if (!validateForm(fields)) return;

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const role = document.getElementById("accountRole")?.value || "customer";

        // Show loading state
        if (registerBtn) registerBtn.disabled = true;
        if (registerSpinner) registerSpinner.style.display = "block";

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, role })
            });

            const data = await parseApiResponse(res);

            if (res.ok) {
                showError("email", "email-error", "Registration successful! Redirecting to sign in...");
                setTimeout(() => window.location.href = "login.html", 1500);
            } else {
                showError("email", "email-error", data.message || "Registration failed. Try again.");
            }
        } catch (error) {
            showError("email", "email-error", friendlyApiError(error, "Network error. Please try again."));
        } finally {
            if (registerBtn) registerBtn.disabled = false;
            if (registerSpinner) registerSpinner.style.display = "none";
        }
    });
}

// ===== Login Form =====
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const loginBtn = document.getElementById("loginBtn");
    const loginSpinner = document.getElementById("loginSpinner");

    emailInput?.addEventListener("blur", () => {
        const value = emailInput.value.trim();
        if (value && !validateEmail(value)) {
            showError("loginEmail", "email-error", "Please enter a valid email");
        } else {
            showError("loginEmail", "email-error", "");
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError("loginEmail", "email-error", "Please fill in all fields");
            return;
        }

        if (!validateEmail(email)) {
            showError("loginEmail", "email-error", "Please enter a valid email");
            return;
        }

        if (loginBtn) loginBtn.disabled = true;
        if (loginSpinner) loginSpinner.style.display = "block";

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await parseApiResponse(res);

            if (res.ok && data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userEmail", email);
                localStorage.setItem("userName", data.user?.username || "");
                window.location.href = "dashboard.html";
            } else {
                showError("loginEmail", "email-error", data.message || "Invalid email or password");
            }
        } catch (error) {
            showError("loginEmail", "email-error", friendlyApiError(error, "Network error. Please try again."));
        } finally {
            if (loginBtn) loginBtn.disabled = false;
            if (loginSpinner) loginSpinner.style.display = "none";
        }
    });
}

// ===== Service Catalog =====
const SERVICE_ICONS = {
    Plumbing: "assets/plumbing.svg",
    Electrical: "assets/electrical.svg",
    Carpentry: "assets/carpentry.svg",
    Painting: "assets/painting.svg",
    Cleaning: "assets/cleaning.svg",
    Landscaping: "assets/landscaping.svg",
    "Car repairs": "assets/car-repairs.svg",
    Catering: "assets/catering.svg",
    "Fashion and tailoring": "assets/tailoring.svg",
    Hairdressing: "assets/hairdressing.svg",
    "Computer repairs": "assets/computer-repairs.svg",
    "Other useful services": "assets/other-services.svg"
};

let SERVICE_CATALOG = [];

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

const loadMarketplaceData = async () => {
    try {
        const response = await fetch(API_BASE + "/services/service-categories");
        const result = await parseApiResponse(response);
        if (!response.ok) throw new Error(result.message || "Unable to load service categories.");
        SERVICE_CATALOG = (result.categories || []).map((category) => ({
            title: category.name,
            description: category.description || category.name + " service support for local community needs.",
            icon: SERVICE_ICONS[category.name] || "assets/logo.svg"
        }));
        if (typeof renderServiceProviders === "function") renderServiceProviders();
        if (typeof renderSearchResults === "function") renderSearchResults();
    } catch (error) {
        const categoryTabs = document.getElementById("serviceCategoryTabs");
        if (categoryTabs) categoryTabs.textContent = error.message || "Unable to load service categories.";
        if (typeof renderServiceProviders === "function") renderServiceProviders(error);
        if (typeof renderSearchResults === "function") renderSearchResults(error);
    }
};

// ===== Contact Form =====
const contactForm = document.querySelector(".contact-form");
const contactMessage = document.getElementById("contactMessage");
if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
        const name = document.getElementById("contactName")?.value.trim() || "";
        const email = document.getElementById("contactEmail")?.value.trim() || "";
        const message = document.getElementById("contactMessageField")?.value.trim() || "";

        if (!name || !email || !message) {
            e.preventDefault();
            if (contactMessage) {
                contactMessage.textContent = "Please complete all fields before sending your message.";
                contactMessage.classList.remove("success");
                contactMessage.classList.add("error");
            }
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            e.preventDefault();
            if (contactMessage) {
                contactMessage.textContent = "Please enter a valid email address.";
                contactMessage.classList.remove("success");
                contactMessage.classList.add("error");
            }
            return;
        }

        if (contactMessage) {
            contactMessage.textContent = "Sending your message…";
            contactMessage.classList.remove("error");
            contactMessage.classList.add("success");
        }
    });
}

// ===== Search Functionality =====
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const searchForm = document.getElementById("searchForm");

const submitSearch = () => {
    const query = searchInput.value.trim();
    if (!query) {
        alert("Please enter a service to search for.");
        searchInput.focus();
        return;
    }
    const encodedQuery = encodeURIComponent(query);
    window.location.href = `search.html?q=${encodedQuery}`;
};

if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        submitSearch();
    });
}

if (searchButton && searchInput) {
    searchButton.addEventListener("click", (e) => {
        e.preventDefault();
        submitSearch();
    });
}

// ===== Search Results Page =====
const searchResults = document.getElementById("searchResults");
const searchQueryText = document.getElementById("searchQueryText");

async function renderSearchResults(error) {
    if (!searchResults || !searchQueryText) return;
    const params = new URLSearchParams(window.location.search);
    const query = (params.get("q") || "").trim();
    const searchField = document.getElementById("searchInput");
    if (searchField && query) searchField.value = query;
    if (query) document.title = `${query} — Smart Community search`;
    searchQueryText.textContent = query
        ? `Service listings matching "${query}"`
        : "Browse available service listings";
    if (error) {
        searchResults.innerHTML = `<div class="result-card"><h3>Search is unavailable</h3><p>${escapeHtml(error.message || "Unable to load marketplace results.")}</p><a href="services.html" class="button">Browse all services</a></div>`;
        return;
    }

    searchResults.innerHTML = `<div class="result-card"><p>Loading available services...</p></div>`;
    try {
        const response = await fetch(`${API_BASE}/services?q=${encodeURIComponent(query)}`);
        const data = await parseApiResponse(response);
        if (!response.ok) throw new Error(data.message || "Unable to search service listings.");
        const services = data.services || [];
        searchResults.innerHTML = services.length ? services.map((service) => `
            <a class="result-card marketplace-result" href="service-detail.html?id=${encodeURIComponent(service._id)}">
                <span class="provider-tag">${escapeHtml(service.category?.name || "Service")}</span>
                <h3>${escapeHtml(service.name)}</h3>
                <p>${escapeHtml(service.description)}</p>
                <span>${escapeHtml(service.providerProfile?.businessName || service.provider?.username || "Local provider")} · ${escapeHtml(service.providerProfile?.location || "Location not listed")}</span>
            </a>
        `).join("") : `<div class="result-card"><h3>No matching listings yet</h3><p>Try a different search, category, or location.</p><a href="services.html" class="button">Browse services</a></div>`;
    } catch (searchError) {
        searchResults.innerHTML = `<div class="result-card"><h3>Unable to search right now</h3><p>${escapeHtml(friendlyApiError(searchError, "Unable to search service listings."))}</p><a href="services.html" class="button">Browse all services</a></div>`;
    }
}

// ===== Services Marketplace =====
const serviceCategoryTabs = document.getElementById("serviceCategoryTabs");
const serviceTitle = document.getElementById("serviceTitle");
const serviceSummary = document.getElementById("serviceSummary");
const providerGrid = document.getElementById("providerGrid");
const providerCount = document.getElementById("providerCount");
const providerProfileModal = document.getElementById("providerProfileModal");
const profileRequestButton = document.getElementById("profileRequestButton");
let SERVICE_LISTINGS = [];
let FAVORITE_PROVIDER_IDS = new Set();

async function loadMarketplaceFavorites() {
    const token = localStorage.getItem("token");
    if (!token || getDecodedTokenPayload().role !== "customer") {
        FAVORITE_PROVIDER_IDS = new Set();
        return;
    }

    const response = await fetch(`${API_BASE}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await parseApiResponse(response);
    if (!response.ok) throw new Error(data.message || "Unable to load saved providers.");
    FAVORITE_PROVIDER_IDS = new Set(
        (data.favorites || []).map((favorite) => String(favorite.provider?._id || ""))
    );
}

function updateFavoriteButtons(providerId) {
    const isFavorite = FAVORITE_PROVIDER_IDS.has(String(providerId));
    document.querySelectorAll("[data-provider-id]").forEach((button) => {
        if (button.dataset.providerId !== String(providerId)) return;
        button.textContent = isFavorite ? "Saved" : "Save provider";
        button.setAttribute("aria-pressed", String(isFavorite));
        button.setAttribute("aria-label", isFavorite ? "Remove provider from favorites" : "Save provider to favorites");
    });
}

async function toggleFavoriteProvider(providerId, button) {
    const token = localStorage.getItem("token");
    const feedback = document.getElementById("serviceFavoriteFeedback");
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    if (getDecodedTokenPayload().role !== "customer") {
        if (feedback) feedback.textContent = "Only customer accounts can save providers.";
        return;
    }

    const wasFavorite = FAVORITE_PROVIDER_IDS.has(String(providerId));
    button.disabled = true;
    try {
        const response = await fetch(`${API_BASE}/favorites/${encodeURIComponent(providerId)}`, {
            method: wasFavorite ? "DELETE" : "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await parseApiResponse(response);
        if (!response.ok) throw new Error(data.message || "Unable to update saved providers.");
        if (wasFavorite) FAVORITE_PROVIDER_IDS.delete(String(providerId));
        else FAVORITE_PROVIDER_IDS.add(String(providerId));
        updateFavoriteButtons(providerId);
        if (feedback) feedback.textContent = data.message;
    } catch (error) {
        const cardFeedback = button.closest(".provider-card")?.querySelector(".favorite-card-feedback");
        if (cardFeedback) cardFeedback.textContent = error.message || "Unable to update saved providers.";
        else if (feedback) feedback.textContent = error.message || "Unable to update saved providers.";
    } finally {
        button.disabled = false;
    }
}

function populateServiceRequest(service) {
    const form = document.getElementById("serviceRequestForm");
    if (!form || !service) return;
    document.getElementById("serviceRequestCategory").value = service.category?.name || "";
    document.getElementById("serviceRequestName").value = service.name || "";
    document.getElementById("serviceRequestProviderName").value = service.providerProfile?.businessName || service.provider?.username || "";
    document.getElementById("serviceRequestServiceId").value = service._id || "";
    const status = document.getElementById("requestStatusMessage");
    if (status) status.textContent = "Selected " + service.name + ". Add your project details to request this service.";
    const formTop = form.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top: formTop, behavior: "smooth" });
}

async function openProviderProfile(service) {
    if (!providerProfileModal || !service?.providerProfile?._id) return;
    const name = document.getElementById("providerProfileName");
    const category = document.getElementById("profileCategory");
    const rating = document.getElementById("profileRating");
    const location = document.getElementById("profileLocation");
    const availability = document.getElementById("profileAvailability");
    const description = document.getElementById("profileDescription");
    const contact = document.getElementById("profileContact");
    const profileServices = document.getElementById("profileServices");
    const profileReviews = document.getElementById("profileReviews");
    name.textContent = "Loading provider profile...";
    providerProfileModal.classList.remove("hidden");
    providerProfileModal.setAttribute("aria-hidden", "false");
    try {
        const response = await fetch(API_BASE + "/providers/" + encodeURIComponent(service.providerProfile._id));
        const data = await parseApiResponse(response);
        if (!response.ok) throw new Error(data.message || "Unable to load provider profile.");
        const profile = data.profile;
        const average = Number(data.rating?.average || 0);
        name.textContent = profile.businessName || profile.user?.username || "Community provider";
        category.textContent = service.category?.name || "Service provider";
        rating.textContent = data.rating?.count ? "Rated " + average.toFixed(1) + " / 5 from " + data.rating.count + " reviews" : "New provider - no reviews yet";
        location.textContent = profile.location || "Location not listed";
        availability.textContent = profile.isAvailable ? "Accepting requests" : "Not accepting requests";
        description.textContent = profile.bio || "This provider has not added a profile description yet.";
        contact.textContent = profile.phone ? "Contact: " + profile.phone : "Contact details are shared after a request is accepted.";
        profileServices.innerHTML = "<h3>Services</h3>" + ((data.services || []).map((item) => "<p>" + escapeHtml(item.name) + " - " + escapeHtml(item.currency) + " " + Number(item.price).toFixed(2) + " / " + escapeHtml(item.priceUnit) + "</p>").join("") || "<p>No active service listings.</p>");
        profileReviews.innerHTML = "<h3>Customer reviews</h3>" + ((data.reviews || []).map((review) => "<p>Rating: " + review.rating + " / 5 - " + escapeHtml(review.comment || "No written comment.") + " <small>by " + escapeHtml(review.customerName) + "</small></p>").join("") || "<p>No reviews yet.</p>");
        profileRequestButton.disabled = !profile.isAvailable;
        profileRequestButton.dataset.serviceId = service._id;
    } catch (error) {
        name.textContent = error.message || "Unable to load provider profile.";
    }
}

function closeProviderProfile() {
    if (!providerProfileModal) return;
    providerProfileModal.classList.add("hidden");
    providerProfileModal.setAttribute("aria-hidden", "true");
}

async function renderServiceProviders(error) {
    if (!providerGrid) return;
    const title = document.getElementById("serviceTitle");
    const summary = document.getElementById("serviceSummary");
    const tabs = document.getElementById("serviceCategoryTabs");
    const params = new URLSearchParams(window.location.search);
    const categoryName = params.get("category") || "";
    const query = params.get("q") || "";
    const location = params.get("location") || "";
    if (title) title.textContent = categoryName ? categoryName + " services" : "Available local services";
    if (summary) summary.textContent = categoryName
        ? "Browse real " + categoryName.toLowerCase() + " listings from local providers."
        : "Compare available service listings from local providers and request the work you need.";
    const searchInput = document.getElementById("serviceSearchInput");
    const locationInput = document.getElementById("serviceLocationInput");
    if (searchInput) searchInput.value = query;
    if (locationInput) locationInput.value = location;
    if (tabs) {
        const links = ["<a class='service-tab " + (!categoryName ? "active" : "") + "' href='services.html'>All services</a>"];
        SERVICE_CATALOG.forEach((item) => links.push("<a class='service-tab " + (item.title === categoryName ? "active" : "") + "' href='services.html?category=" + encodeURIComponent(item.title) + "'>" + escapeHtml(item.title) + "</a>"));
        tabs.innerHTML = links.join("");
    }
    if (error) {
        providerGrid.innerHTML = "<div class='provider-card no-results'><h3>Marketplace unavailable</h3><p>" + escapeHtml(error.message || "Unable to load service listings.") + "</p></div>";
        if (providerCount) providerCount.textContent = "Listings unavailable";
        return;
    }
    providerGrid.innerHTML = "<div class='provider-card no-results'><p>Loading available service listings...</p></div>";
    try {
        const searchParams = new URLSearchParams();
        if (categoryName) searchParams.set("category", categoryName);
        if (query) searchParams.set("q", query);
        if (location) searchParams.set("location", location);
        const response = await fetch(API_BASE + "/services?" + searchParams.toString());
        const data = await parseApiResponse(response);
        if (!response.ok) throw new Error(data.message || "Unable to load service listings.");
        SERVICE_LISTINGS = data.services || [];
        try {
            await loadMarketplaceFavorites();
            const favoriteFeedback = document.getElementById("serviceFavoriteFeedback");
            if (favoriteFeedback) favoriteFeedback.textContent = "";
        } catch (error) {
            const favoriteFeedback = document.getElementById("serviceFavoriteFeedback");
            if (favoriteFeedback) favoriteFeedback.textContent = error.message || "Saved provider status is unavailable.";
            FAVORITE_PROVIDER_IDS = new Set();
        }
        if (providerCount) providerCount.textContent = SERVICE_LISTINGS.length + " service listing" + (SERVICE_LISTINGS.length === 1 ? "" : "s");
        const selectedService = SERVICE_LISTINGS.find((service) => service._id === params.get("serviceId"));
        if (selectedService) populateServiceRequest(selectedService);
        providerGrid.innerHTML = SERVICE_LISTINGS.length ? SERVICE_LISTINGS.map((service) => {
            const rating = Number(service.rating?.average || 0);
            const ratingCount = Number(service.rating?.count || 0);
            const ratingText = ratingCount ? "★ " + rating.toFixed(1) + " (" + ratingCount + ")" : "New";
            const ratingTitle = ratingCount
                ? "Rated " + rating.toFixed(1) + " out of 5 from " + ratingCount + " review" + (ratingCount === 1 ? "" : "s")
                : "No reviews yet";
            const price = new Intl.NumberFormat(undefined, { style: "currency", currency: service.currency || "USD" }).format(Number(service.price || 0));
            const priceUnit = service.priceUnit === "hour" ? "/ hour" : service.priceUnit === "visit" ? "/ visit" : "";
            const providerId = String(service.provider?._id || service.providerProfile?.user || "");
            const canSave = !localStorage.getItem("token") || getDecodedTokenPayload().role === "customer";
            const isFavorite = FAVORITE_PROVIDER_IDS.has(providerId);
            const providerName = service.providerProfile?.businessName || service.provider?.username || "Local provider";
            const providerLocation = service.providerProfile?.location || "Location not listed";
            return `<article class="provider-card">
                <div class="provider-card-head"><span class="provider-tag">${escapeHtml(service.category?.name || "Service")}</span><span class="provider-rating" title="${escapeHtml(ratingTitle)}">${escapeHtml(ratingText)}</span></div>
                <h3>${escapeHtml(service.name)}</h3>
                <p class="provider-byline">${escapeHtml(providerName)} · ${escapeHtml(providerLocation)}</p>
                <p class="provider-description">${escapeHtml(service.description)}</p>
                <div class="provider-card-foot">
                    <p class="service-price"><strong>${escapeHtml(price)}</strong>${priceUnit ? " " + escapeHtml(priceUnit) : ""}</p>
                    <div class="provider-actions"><a class="provider-button" href="service-detail.html?id=${encodeURIComponent(service._id)}">Details</a><button type="button" class="provider-button secondary" data-action="profile" data-id="${escapeHtml(service._id)}">Provider</button><button type="button" class="provider-button primary" data-action="request" data-id="${escapeHtml(service._id)}">Request</button>${canSave && providerId ? `<button type="button" class="provider-button secondary favorite-toggle" data-action="favorite" data-provider-id="${escapeHtml(providerId)}" aria-pressed="${isFavorite}" aria-label="${isFavorite ? "Remove provider from favorites" : "Save provider to favorites"}">${isFavorite ? "Saved" : "Save"}</button>` : ""}</div>
                </div>
                <small class="favorite-card-feedback" aria-live="polite"></small>
            </article>`;
        }).join("") : "<div class='provider-card no-results'><h3>No listings found</h3><p>Try a different category, search, or location. Providers can add listings from their dashboard.</p></div>";
    } catch (loadError) {
        providerGrid.innerHTML = "<div class='provider-card no-results'><h3>Unable to load listings</h3><p>" + escapeHtml(loadError.message || "Please try again later.") + "</p></div>";
        if (providerCount) providerCount.textContent = "Listings unavailable";
    }
}

if (providerGrid) {
    providerGrid.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        if (button.dataset.action === "favorite") {
            await toggleFavoriteProvider(button.dataset.providerId, button);
            return;
        }
        const service = SERVICE_LISTINGS.find((item) => item._id === button.dataset.id);
        if (!service) return;
        if (button.dataset.action === "profile") {
            await openProviderProfile(service);
        } else {
            populateServiceRequest(service);
        }
    });
}

if (profileRequestButton) {
    profileRequestButton.addEventListener("click", () => {
        const service = SERVICE_LISTINGS.find((item) => item._id === profileRequestButton.dataset.serviceId);
        if (service) populateServiceRequest(service);
        closeProviderProfile();
    });
}

if (providerProfileModal) {
    providerProfileModal.addEventListener("click", (event) => {
        if (event.target === providerProfileModal) closeProviderProfile();
    });
}

document.getElementById("closeProfileModal")?.addEventListener("click", closeProviderProfile);
document.getElementById("serviceFilters")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const category = new URLSearchParams(window.location.search).get("category");
    if (category) params.set("category", category);
    const query = document.getElementById("serviceSearchInput")?.value.trim();
    const location = document.getElementById("serviceLocationInput")?.value.trim();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    window.location.href = "services.html" + (params.toString() ? "?" + params.toString() : "");
});

const requestForm = document.getElementById("serviceRequestForm");
const requestStatusMessage = document.getElementById("requestStatusMessage");
if (requestForm) {
    requestForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            if (requestStatusMessage) requestStatusMessage.textContent = "Please log in as a customer to submit a service request.";
            window.location.href = "login.html";
            return;
        }
        const payload = {
            serviceId: document.getElementById("serviceRequestServiceId").value,
            preferredDate: document.getElementById("serviceRequestDate").value,
            preferredTime: document.getElementById("serviceRequestTime").value,
            location: document.getElementById("serviceRequestLocation").value.trim(),
            message: document.getElementById("serviceRequestMessage").value.trim()
        };
        if (!payload.serviceId) {
            if (requestStatusMessage) requestStatusMessage.textContent = "Choose an active service listing before submitting your request.";
            return;
        }
        if (requestStatusMessage) requestStatusMessage.textContent = "Submitting your request...";
        try {
            const response = await fetch(API_BASE + "/requests/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify(payload)
            });
            const data = await parseApiResponse(response);
            if (!response.ok) throw new Error(data.message || "Request submission failed.");
            requestForm.reset();
            if (requestStatusMessage) requestStatusMessage.textContent = data.message || "Your service request has been submitted.";
        } catch (error) {
            if (requestStatusMessage) requestStatusMessage.textContent = error.message || "Unable to submit your request right now.";
        }
    });
}

// Only marketplace and search pages need the category catalog. Loading it on
// auth or dashboard pages caused avoidable requests and console noise.
if (document.getElementById("serviceCategoryTabs") || document.getElementById("searchResults")) {
    loadMarketplaceData();
}

// ===== Dashboard =====
const welcomeText = document.getElementById("welcomeText");
let dashboardRole = "";
if (welcomeText) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
    } else {
        welcomeText.textContent = "Welcome back";
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
}

function getDecodedTokenPayload() {
    const token = localStorage.getItem("token");
    if (!token || !token.includes(".")) {
        return {};
    }

    try {
        const payload = token.split(".")[1];
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        return JSON.parse(atob(padded));
    } catch (error) {
        return {};
    }
}

const requestList = document.getElementById("requestList");

async function loadRequestQueue() {
    if (!requestList) {
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        requestList.innerHTML = "<li>Please log in to view service activity.</li>";
        return;
    }

    try {
        const role = dashboardRole || getDecodedTokenPayload().role || "customer";
        const endpoint = role === "provider" ? `${API_BASE}/requests/provider` : `${API_BASE}/requests/mine`;
        const response = await fetch(endpoint, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await parseApiResponse(response);
        if (!response.ok) {
            throw new Error(data.message || "Unable to load request list.");
        }

        const items = data.requests || [];
        if (requestFeedback && requestFeedback.dataset.error === "true") {
            requestFeedback.textContent = "";
            delete requestFeedback.dataset.error;
        }
        updateDashboardStats(items, role);
        if (!items.length) {
            requestList.innerHTML = "<li>No service requests yet.</li>";
            if (role === "provider") await refreshLocationAccessState();
            return;
        }

        requestList.innerHTML = items.map((item) => {
            const actions = role === "provider"
                ? (item.status === "pending"
                    ? `<button type="button" class="mini-button accept" data-id="${escapeHtml(item._id)}" data-status="accepted">Accept</button><button type="button" class="mini-button reject" data-id="${escapeHtml(item._id)}" data-status="rejected">Reject</button>`
                    : item.status === "accepted"
                        ? `<button type="button" class="mini-button accept" data-id="${escapeHtml(item._id)}" data-status="in_progress">Start job</button>`
                        : item.status === "in_progress"
                            ? `<button type="button" class="mini-button accept" data-id="${escapeHtml(item._id)}" data-status="completed">Mark complete</button>`
                            : "")
                : (["pending", "accepted"].includes(item.status)
                    ? `<button type="button" class="mini-button reject" data-action="cancel" data-id="${escapeHtml(item._id)}">Cancel request</button>`
                    : item.status === "completed" && !item.hasReview
                        ? `<form class="review-form" data-id="${escapeHtml(item._id)}"><label>Rating<select name="rating" required><option value="">Rate</option><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Very poor</option></select></label><label>Review<textarea name="comment" maxlength="1200" rows="2" placeholder="Share your experience"></textarea></label><button type="submit" class="mini-button accept">Submit review</button></form>`
                        : item.hasReview ? "<small>Review submitted</small>" : "");
            const contactLine = role === "provider" && item.customer?.phone
                ? `<small>Customer phone: ${escapeHtml(item.customer.phone)}</small>`
                : `<small>${escapeHtml(item.providerName || "Local provider")}</small>`;
            const statusLabel = String(item.status || "").replace(/_/g, " ");
            const history = (item.history || []).map((entry) => {
                const eventTime = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "";
                const status = (entry.toStatus || item.status).replace("_", " ");
                return `<li><span>${escapeHtml(status)}</span><small>${escapeHtml(eventTime)}</small></li>`;
            }).join("");
            const conversation = item.provider?._id ? `<details class="request-conversation" data-request-id="${escapeHtml(item._id)}">
                <summary>Messages</summary>
                <ul class="conversation-messages" data-message-list><li>Open this conversation to load messages.</li></ul>
                <form class="message-compose" data-request-id="${escapeHtml(item._id)}">
                    <label>Send a message<textarea name="body" rows="2" maxlength="2000" required placeholder="Write to the ${role === "provider" ? "customer" : "provider"}"></textarea></label>
                    <button type="submit" class="mini-button accept">Send message</button>
                    <small class="message-feedback" aria-live="polite"></small>
                </form>
            </details>` : "";
            return `<li class="request-item" id="service-request-${escapeHtml(item._id)}">
                <div><strong>${escapeHtml(item.serviceName || item.service?.name || "Service request")}</strong><span>${escapeHtml(item.category || "Service")}</span><p>${escapeHtml(item.message || "")}</p></div>
                <div class="request-item-meta"><span class="status-pill status-${escapeHtml(item.status)}">${escapeHtml(statusLabel)}</span>${contactLine}${item.location ? `<small>Location: ${escapeHtml(item.location)}</small>` : ""}${item.preferredDate ? `<small>Preferred: ${escapeHtml(item.preferredDate)} ${escapeHtml(item.preferredTime || "")}</small>` : ""}${history ? `<details class="request-timeline"><summary>Request history</summary><ol>${history}</ol></details>` : ""}${conversation}<div class="requestActions">${actions}</div></div>
            </li>`;
        }).join("");
        if (role === "provider") await refreshLocationAccessState();
    } catch (error) {
        requestList.textContent = error.message || "Unable to load your request activity.";
        if (requestFeedback) requestFeedback.dataset.error = "true";
    }
}

function updateDashboardStats(items, role) {
    const active = role === "provider"
        ? items.filter((item) => ["pending", "accepted", "in_progress"].includes(item.status)).length
        : items.filter((item) => ["accepted", "in_progress"].includes(item.status)).length;
    const requestTotal = document.getElementById("dashboardRequestTotal");
    const activeTotal = document.getElementById("dashboardActiveTotal");
    const completedTotal = document.getElementById("dashboardCompletedTotal");
    if (requestTotal) requestTotal.textContent = items.length;
    if (activeTotal) activeTotal.textContent = active;
    if (completedTotal) completedTotal.textContent = items.filter((item) => item.status === "completed").length;
    const label = document.getElementById("dashboardActiveLabel");
    if (label) label.textContent = role === "provider" ? "Open jobs" : "In progress";
}

async function dashboardApi(path, options = {}) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });
    const data = await parseApiResponse(response);
    if (!response.ok) {
        const error = new Error(data.message || "The request could not be completed.");
        error.status = response.status;
        throw error;
    }
    return data;
}

const notificationToggle = document.getElementById("notificationToggle");
const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const notificationCount = document.getElementById("notificationCount");
let notificationTimer = null;
let notificationLoadInProgress = false;
let conversationTimer = null;

async function loadNotifications() {
    if (!notificationList || notificationLoadInProgress || document.hidden) return;
    notificationLoadInProgress = true;
    try {
        const data = await dashboardApi("/notifications/mine");
        const notifications = data.notifications || [];
        if (notificationCount) {
            notificationCount.textContent = String(data.unreadCount || 0);
            notificationCount.classList.toggle("hidden", !data.unreadCount);
        }
        notificationList.innerHTML = notifications.length ? notifications.map((item) => `
            <li class="${item.readAt ? "read" : "unread"}">
                <button type="button" class="notification-item" data-id="${escapeHtml(item._id)}" data-request="${escapeHtml(item.request || "")}" data-message="${escapeHtml(item.message || "")}">
                    <strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body)}</span><small>${escapeHtml(new Date(item.createdAt).toLocaleString())}</small>
                </button>
            </li>
        `).join("") : "<li>No notifications yet.</li>";
    } catch (error) {
        notificationList.textContent = error.message || "Unable to load notifications.";
    } finally {
        notificationLoadInProgress = false;
    }
}

notificationToggle?.addEventListener("click", () => {
    const isOpen = notificationPanel.classList.toggle("hidden") === false;
    notificationToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) loadNotifications();
});

notificationList?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    try {
        await dashboardApi(`/notifications/${encodeURIComponent(button.dataset.id)}/read`, { method: "PATCH" });
        if (button.dataset.request) {
            notificationPanel.classList.add("hidden");
            notificationToggle.setAttribute("aria-expanded", "false");
            document.getElementById(`service-request-${button.dataset.request}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            if (button.dataset.message) {
                const conversation = document.getElementById(`service-request-${button.dataset.request}`)?.querySelector(".request-conversation");
                if (conversation) {
                    conversation.open = true;
                    await loadConversation(conversation);
                }
            }
        }
        await loadNotifications();
    } catch (error) {
        notificationList.textContent = error.message || "Unable to mark the notification as read.";
    }
});

document.getElementById("markNotificationsRead")?.addEventListener("click", async () => {
    try {
        await dashboardApi("/notifications/mine/read-all", { method: "PATCH" });
        await loadNotifications();
    } catch (error) {
        notificationList.textContent = error.message || "Unable to update notifications.";
    }
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadNotifications();
});

const requestFeedback = document.getElementById("requestFeedback");
async function loadConversation(details) {
    const requestId = details.dataset.requestId;
    const list = details.querySelector("[data-message-list]");
    if (!details.open || !list || details.dataset.loading === "true") return;
    details.dataset.loading = "true";
    try {
        const data = await dashboardApi(`/messages/${encodeURIComponent(requestId)}`);
        const currentUserId = getDecodedTokenPayload().id;
        const messages = data.messages || [];
        list.innerHTML = messages.length ? messages.map((message) => `
            <li class="${message.sender === currentUserId ? "sent" : "received"}">
                <strong>${message.sender === currentUserId ? "You" : "Other participant"}</strong>
                <p>${escapeHtml(message.body)}</p>
                <small>${escapeHtml(new Date(message.createdAt).toLocaleString())}</small>
            </li>
        `).join("") : "<li>No messages yet. Start the conversation.</li>";
        list.scrollTop = list.scrollHeight;
        details.dataset.loaded = "true";
    } catch (error) {
        list.textContent = error.message || "Unable to load messages.";
    } finally {
        details.dataset.loading = "false";
    }
}

if (requestList) {
    requestList.addEventListener("click", async (event) => {
        const summary = event.target.closest("summary");
        const conversationDetails = summary?.closest("details.request-conversation");
        if (conversationDetails) {
            window.setTimeout(() => {
                if (conversationDetails.open) loadConversation(conversationDetails);
            }, 0);
            return;
        }
        const button = event.target.closest("button[data-id]");
        if (!button) return;
        const id = button.dataset.id;
        try {
            if (button.dataset.action === "cancel") {
                await dashboardApi(`/requests/${encodeURIComponent(id)}/cancel`, { method: "POST" });
            } else {
                await dashboardApi(`/requests/${encodeURIComponent(id)}/status`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: button.dataset.status })
                });
            }
            if (requestFeedback) {
                requestFeedback.textContent = "Request updated successfully.";
                delete requestFeedback.dataset.error;
            }
            await loadRequestQueue();
        } catch (error) {
            if (requestFeedback) requestFeedback.textContent = error.message || "Unable to update request.";
        }
    });

    requestList.addEventListener("submit", async (event) => {
        const messageForm = event.target.closest(".message-compose");
        if (messageForm) {
            event.preventDefault();
            const textarea = messageForm.elements.body;
            const feedback = messageForm.querySelector(".message-feedback");
            try {
                const data = await dashboardApi(`/messages/${encodeURIComponent(messageForm.dataset.requestId)}`, {
                    method: "POST",
                    body: JSON.stringify({ body: textarea.value.trim() })
                });
                textarea.value = "";
                if (feedback) feedback.textContent = data.message;
                await loadConversation(messageForm.closest(".request-conversation"));
                await loadNotifications();
            } catch (error) {
                if (feedback) feedback.textContent = error.message || "Unable to send message.";
            }
            return;
        }
        const form = event.target.closest(".review-form");
        if (!form) return;
        event.preventDefault();
        const formData = new FormData(form);
        try {
            const data = await dashboardApi(`/requests/${encodeURIComponent(form.dataset.id)}/review`, {
                method: "POST",
                body: JSON.stringify({
                    rating: Number(formData.get("rating")),
                    comment: String(formData.get("comment") || "").trim()
                })
            });
            if (requestFeedback) requestFeedback.textContent = data.message || "Review submitted.";
            await loadRequestQueue();
        } catch (error) {
            if (requestFeedback) requestFeedback.textContent = error.message || "Unable to submit review.";
        }
    });
}

async function loadProviderServices() {
    const container = document.getElementById("serviceListingList");
    if (!container) return;
    container.textContent = "Loading your service listings...";
    try {
        const data = await dashboardApi("/services/mine");
        const services = data.services || [];
        container.innerHTML = services.length ? `<h3>Your listings</h3>${services.map((service) => `
            <article class="dashboard-list-item">
                <div><strong>${escapeHtml(service.name)}</strong><span>${escapeHtml(service.category?.name || "Service")} - ${escapeHtml(service.currency)} ${Number(service.price).toFixed(2)} / ${escapeHtml(service.priceUnit)}</span><p>${escapeHtml(service.description)}</p><small>${service.isActive ? "Published" : "Closed"}</small></div>
                <div class="dashboard-list-actions">${service.isActive ? `<button type="button" class="mini-button" data-edit-service="${escapeHtml(service._id)}">Edit</button><button type="button" class="mini-button reject" data-close-service="${escapeHtml(service._id)}">Close listing</button>` : ""}</div>
            </article>
        `).join("")}` : "<p>You have not added any services yet.</p>";
        container.querySelectorAll("[data-edit-service]").forEach((button) => {
            button.addEventListener("click", () => {
                const service = services.find((item) => item._id === button.dataset.editService);
                if (!service) return;
                document.getElementById("listingEditId").value = service._id;
                document.getElementById("listingName").value = service.name;
                document.getElementById("listingCategory").value = service.category?._id || service.category;
                document.getElementById("listingDescription").value = service.description;
                document.getElementById("listingPrice").value = service.price;
                document.getElementById("listingCurrency").value = service.currency;
                document.getElementById("listingPriceUnit").value = service.priceUnit;
                document.getElementById("serviceListingSubmit").textContent = "Save changes";
                document.getElementById("cancelServiceEdit").classList.remove("hidden");
                document.getElementById("serviceListingForm").scrollIntoView({ behavior: "smooth", block: "center" });
            });
        });
        container.querySelectorAll("[data-close-service]").forEach((button) => {
            button.addEventListener("click", async () => {
                if (!window.confirm("Close this listing? Customers will no longer be able to request it.")) return;
                try {
                    await dashboardApi(`/services/${encodeURIComponent(button.dataset.closeService)}`, { method: "DELETE" });
                    await loadProviderServices();
                } catch (error) {
                    if (document.getElementById("serviceListingMessage")) {
                        document.getElementById("serviceListingMessage").textContent = error.message;
                    }
                }
            });
        });
    } catch (error) {
        container.textContent = error.message || "Unable to load your service listings.";
    }
}

async function loadProviderWorkspace() {
    const profileMessage = document.getElementById("providerProfileMessage");
    const categorySelect = document.getElementById("listingCategory");
    try {
        const [profileResponse, categoriesResponse] = await Promise.all([
            fetch(`${API_BASE}/providers/me`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
            fetch(`${API_BASE}/services/service-categories`)
        ]);
        const profileData = await parseApiResponse(profileResponse);
        const categoriesData = await parseApiResponse(categoriesResponse);
        if (!categoriesResponse.ok) throw new Error(categoriesData.message || "Unable to load service categories.");
        if (!profileResponse.ok && profileResponse.status !== 404) throw new Error(profileData.message || "Unable to load provider profile.");
        categorySelect.innerHTML = `<option value="">Choose a category</option>${(categoriesData.categories || []).map((category) => `<option value="${escapeHtml(category._id)}">${escapeHtml(category.name)}</option>`).join("")}`;
        if (profileData.profile) {
            const profile = profileData.profile;
            document.getElementById("businessName").value = profile.businessName || "";
            document.getElementById("providerBio").value = profile.bio || "";
            document.getElementById("providerPhone").value = profile.phone || "";
            document.getElementById("providerLocation").value = profile.location || "";
            document.getElementById("providerAvailable").checked = profile.isAvailable;
            const reviewsData = await dashboardApi(`/providers/${encodeURIComponent(profile._id)}`);
            const reviewList = document.getElementById("providerReviewList");
            reviewList.innerHTML = `<h3>Customer reviews</h3>${(reviewsData.reviews || []).length
                ? `<ul class="review-list">${(reviewsData.reviews || []).map((review) => `<li><div class="review-list-head"><strong>${escapeHtml(review.customerName)}</strong><span>${Number(review.rating)} / 5</span></div><p>${escapeHtml(review.comment || "No written comment.")}</p></li>`).join("")}</ul>`
                : "<p class=\"dashboard-empty\">No reviews yet. Completed jobs can be reviewed by customers.</p>"}`;
        } else if (profileMessage) {
            profileMessage.textContent = "Complete your provider profile before publishing services.";
        }
        await loadProviderServices();
    } catch (error) {
        if (profileMessage) profileMessage.textContent = error.message || "Unable to load provider setup.";
    }
}

async function loadCustomerFavorites() {
    const card = document.getElementById("favoriteProvidersCard");
    const list = document.getElementById("favoriteProviderList");
    if (!card || !list) return;
    card.classList.remove("hidden");
    list.textContent = "Loading saved providers...";
    try {
        const data = await dashboardApi("/favorites");
        const favorites = data.favorites || [];
        list.innerHTML = favorites.length ? favorites.map((favorite) => {
            const provider = favorite.provider;
            const profile = provider.profile;
            const name = profile?.businessName || provider.username || "Local provider";
            return `<li class="favorite-provider-item">
                <div>
                    <strong>${escapeHtml(name)}</strong>
                    <small>${escapeHtml(profile?.location || "Location not listed")}${profile?.isAvailable ? " · Accepting requests" : " · Not accepting requests"}</small>
                </div>
                <div class="favorite-provider-actions">
                    <a class="mini-button" href="services.html?q=${encodeURIComponent(name)}">View services</a>
                    <button type="button" class="mini-button reject" data-remove-favorite="${escapeHtml(provider._id)}">Remove</button>
                </div>
            </li>`;
        }).join("") : "<li class=\"favorite-empty-state\">No saved providers yet. Browse services to save providers you like.</li>";
    } catch (error) {
        list.textContent = error.message || "Unable to load saved providers.";
    }
}

document.getElementById("favoriteProviderList")?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-remove-favorite]");
    if (!button) return;
    button.disabled = true;
    try {
        await dashboardApi(`/favorites/${encodeURIComponent(button.dataset.removeFavorite)}`, { method: "DELETE" });
        await loadCustomerFavorites();
    } catch (error) {
        const list = document.getElementById("favoriteProviderList");
        if (list) list.textContent = error.message || "Unable to remove the saved provider.";
        button.disabled = false;
    }
});

async function initializeDashboard() {
    const token = localStorage.getItem("token");
    if (!token || !welcomeText) return;
    try {
        const data = await dashboardApi("/auth/me");
        const user = data.user;
        const role = user.role || "customer";
        dashboardRole = role;
        welcomeText.textContent = `Welcome, ${user.username}!`;
        document.getElementById("accountUsername").value = user.username || "";
        document.getElementById("accountPhone").value = user.phone || "";
        document.getElementById("accountLocation").value = user.location || "";
        document.getElementById("workspaceTitle").textContent = role === "provider" ? "Provider workspace" : "Your profile";
        document.getElementById("providerWorkspace").classList.toggle("hidden", role !== "provider");
        document.getElementById("customerProfileCard").classList.toggle("hidden", role !== "customer");
        document.getElementById("locationCard").classList.toggle("hidden", role !== "provider");
        if (role === "provider") await loadProviderWorkspace();
        if (role === "customer") await loadCustomerFavorites();
        await loadRequestQueue();
        await loadNotifications();
        if (!notificationTimer) notificationTimer = window.setInterval(loadNotifications, 10000);
        if (!conversationTimer) {
            conversationTimer = window.setInterval(() => {
                document.querySelectorAll(".request-conversation[open]").forEach(loadConversation);
            }, 15000);
        }
    } catch (error) {
        const dashboardMain = document.querySelector(".dashboard");
        if (requestFeedback) {
            requestFeedback.textContent = friendlyApiError(error, "Unable to load dashboard.");
            requestFeedback.dataset.error = "true";
        }
        if (error.status === 401 || /authentication|token|unauthorized/i.test(error.message || "")) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }
        showServiceAvailabilityNotice(dashboardMain);
    }
}

document.getElementById("accountProfileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("accountProfileMessage");
    try {
        const data = await dashboardApi("/auth/me", {
            method: "PATCH",
            body: JSON.stringify({
                username: document.getElementById("accountUsername").value.trim(),
                phone: document.getElementById("accountPhone").value.trim(),
                location: document.getElementById("accountLocation").value.trim()
            })
        });
        if (message) message.textContent = data.message || "Account details saved.";
        if (welcomeText) welcomeText.textContent = `Welcome, ${data.user.username}!`;
    } catch (error) {
        if (message) message.textContent = error.message || "Unable to save account details.";
    }
});

document.getElementById("passwordForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("passwordMessage");
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const setMessage = (text, tone = "") => {
        if (!message) return;
        message.textContent = text;
        message.classList.toggle("success", tone === "success");
        message.classList.toggle("error", tone === "error");
    };

    if (newPassword !== confirmPassword) {
        setMessage("The new passwords do not match.", "error");
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
        const data = await dashboardApi("/auth/password", {
            method: "PATCH",
            body: JSON.stringify({ currentPassword, newPassword })
        });
        form.reset();
        setMessage(data.message || "Password updated.", "success");
    } catch (error) {
        setMessage(friendlyApiError(error, "Unable to update your password."), "error");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

document.getElementById("refreshRequests")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const label = button.textContent;
    button.textContent = "Refreshing...";
    try {
        await loadRequestQueue();
    } finally {
        button.disabled = false;
        button.textContent = label;
    }
});

document.getElementById("providerProfileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("providerProfileMessage");
    try {
        const data = await dashboardApi("/providers/me", {
            method: "PUT",
            body: JSON.stringify({
                businessName: document.getElementById("businessName").value.trim(),
                bio: document.getElementById("providerBio").value.trim(),
                phone: document.getElementById("providerPhone").value.trim(),
                location: document.getElementById("providerLocation").value.trim(),
                isAvailable: document.getElementById("providerAvailable").checked
            })
        });
        if (message) message.textContent = data.message || "Provider profile saved.";
        await loadProviderWorkspace();
    } catch (error) {
        if (message) message.textContent = error.message || "Unable to save provider profile.";
    }
});

const serviceListingForm = document.getElementById("serviceListingForm");
serviceListingForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("serviceListingMessage");
    const editId = document.getElementById("listingEditId").value;
    const payload = {
        name: document.getElementById("listingName").value.trim(),
        category: document.getElementById("listingCategory").value,
        description: document.getElementById("listingDescription").value.trim(),
        price: Number(document.getElementById("listingPrice").value),
        currency: document.getElementById("listingCurrency").value.trim().toUpperCase(),
        priceUnit: document.getElementById("listingPriceUnit").value
    };
    try {
        const data = await dashboardApi(editId ? `/services/${encodeURIComponent(editId)}` : "/services", {
            method: editId ? "PATCH" : "POST",
            body: JSON.stringify(payload)
        });
        if (message) message.textContent = data.message || "Service listing saved.";
        serviceListingForm.reset();
        document.getElementById("listingEditId").value = "";
        document.getElementById("listingCurrency").value = "USD";
        document.getElementById("serviceListingSubmit").textContent = "Publish service";
        document.getElementById("cancelServiceEdit").classList.add("hidden");
        await loadProviderServices();
    } catch (error) {
        if (message) message.textContent = error.message || "Unable to save service listing.";
    }
});

document.getElementById("cancelServiceEdit")?.addEventListener("click", () => {
    serviceListingForm?.reset();
    document.getElementById("listingEditId").value = "";
    document.getElementById("listingCurrency").value = "USD";
    document.getElementById("serviceListingSubmit").textContent = "Publish service";
    document.getElementById("cancelServiceEdit").classList.add("hidden");
});

const locationBadge = document.getElementById("locationBadge");
const locationStatusText = document.getElementById("locationStatusText");
const locationMessage = document.getElementById("locationMessage");
const startLocationSharingBtn = document.getElementById("startLocationSharingBtn");
const stopLocationSharingBtn = document.getElementById("stopLocationSharingBtn");

let locationWatchId = null;
let lastLocationUpdateAt = 0;

function setLocationUi({ sharing, message, tone = "neutral" }) {
    if (locationBadge) {
        const statusText = sharing ? "Sharing" : "Not sharing";
        locationBadge.textContent = statusText;
        locationBadge.classList.toggle("active", !!sharing);
    }

    if (locationStatusText) {
        locationStatusText.textContent = sharing
            ? "Location sharing is on. Only authorized service access can view your recent location."
            : "Location sharing is off. This feature is only available for provider accounts with an active job.";
    }

    if (locationMessage) {
        locationMessage.textContent = message || "";
        locationMessage.classList.remove("error", "success");
        if (tone === "error") {
            locationMessage.classList.add("error");
        }
        if (tone === "success") {
            locationMessage.classList.add("success");
        }
    }
}

async function sendLocationUpdate(latitude, longitude, mode = "start") {
    const token = localStorage.getItem("token");
    if (!token) {
        setLocationUi({ sharing: false, message: "Please log in to share your live location.", tone: "error" });
        return;
    }

    const response = await fetch(`${API_BASE}/location/${mode}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude })
    });

    const data = await parseApiResponse(response);

    if (!response.ok) {
        throw new Error(data.message || "Location update failed.");
    }

    return data;
}

function stopWatchingLocation() {
    if (locationWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
}

async function stopLocationSharing() {
    if (!startLocationSharingBtn || !stopLocationSharingBtn) {
        return;
    }

    stopWatchingLocation();
    setLocationUi({ sharing: false, message: "Stopping location sharing..." });

    const token = localStorage.getItem("token");
    if (!token) {
        setLocationUi({ sharing: false, message: "Please log in to stop sharing.", tone: "error" });
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/location/stop`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
            throw new Error(data.message || "Could not stop location sharing.");
        }

        setLocationUi({ sharing: false, message: "Location sharing is OFF.", tone: "success" });
    } catch (error) {
        setLocationUi({ sharing: false, message: error.message || "Unable to stop sharing right now.", tone: "error" });
    }
}

function handleGeolocationError(error) {
    let message = "Location is unavailable right now.";

    if (error.code === error.PERMISSION_DENIED) {
        message = "Location permission was denied. Please allow access to share your live location.";
    } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = "Your device could not determine the current location.";
    } else if (error.code === error.TIMEOUT) {
        message = "Location request timed out. Please try again.";
    }

    setLocationUi({ sharing: false, message, tone: "error" });
    stopWatchingLocation();
}

async function startLocationSharing() {
    if (!startLocationSharingBtn || !stopLocationSharingBtn) {
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        setLocationUi({ sharing: false, message: "Please log in first.", tone: "error" });
        window.location.href = "login.html";
        return;
    }

    const role = getDecodedTokenPayload().role || "customer";
    if (role !== "provider") {
        setLocationUi({
            sharing: false,
            message: "Live location sharing is only available for provider accounts.",
            tone: "error"
        });
        return;
    }

    if (!navigator.geolocation) {
        setLocationUi({ sharing: false, message: "This browser does not support geolocation.", tone: "error" });
        return;
    }

    setLocationUi({ sharing: true, message: "Requesting browser permission for your live location..." });

    const onLocationSuccess = async (position) => {
        const now = Date.now();
        const { latitude, longitude } = position.coords;
        const shouldSend = now - lastLocationUpdateAt > 15000;

        if (shouldSend) {
            lastLocationUpdateAt = now;
            try {
                const result = await sendLocationUpdate(latitude, longitude, "start");
                setLocationUi({
                    sharing: true,
                    message: `Location sharing is ON. Last updated at ${new Date(result.location.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
                    tone: "success"
                });
            } catch (error) {
                setLocationUi({ sharing: false, message: error.message || "Unable to update your location.", tone: "error" });
                stopWatchingLocation();
            }
        }
    };

    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const result = await sendLocationUpdate(position.coords.latitude, position.coords.longitude, "start");
            setLocationUi({
                sharing: true,
                message: `Location sharing is ON. Last updated at ${new Date(result.location.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
                tone: "success"
            });

            if (locationWatchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(locationWatchId);
            }

            locationWatchId = navigator.geolocation.watchPosition(onLocationSuccess, handleGeolocationError, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000
            });
        } catch (error) {
            setLocationUi({ sharing: false, message: error.message || "Unable to start location sharing.", tone: "error" });
        }
    }, handleGeolocationError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000
    });
}

if (startLocationSharingBtn) {
    startLocationSharingBtn.addEventListener("click", startLocationSharing);
}

if (stopLocationSharingBtn) {
    stopLocationSharingBtn.addEventListener("click", stopLocationSharing);
}

async function refreshLocationAccessState() {
    if (!locationBadge || !locationStatusText || !locationMessage) {
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        setLocationUi({ sharing: false, message: "Please log in to use live location sharing.", tone: "error" });
        if (startLocationSharingBtn) startLocationSharingBtn.disabled = true;
        if (stopLocationSharingBtn) stopLocationSharingBtn.disabled = true;
        return;
    }

    const role = getDecodedTokenPayload().role || "customer";
    if (role !== "provider") {
        setLocationUi({
            sharing: false,
            message: "Live location sharing is currently reserved for provider accounts.",
            tone: "neutral"
        });
        if (startLocationSharingBtn) startLocationSharingBtn.disabled = true;
        if (stopLocationSharingBtn) stopLocationSharingBtn.disabled = true;
        return;
    }

    try {
        setLocationUi({ sharing: false, message: "Checking for an active service request...", tone: "neutral" });
        const response = await fetch(`${API_BASE}/requests/provider`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await parseApiResponse(response);
        if (!response.ok) {
            throw new Error(data.message || "Unable to load request status.");
        }

        const approved = (data.requests || []).some((request) => ["accepted", "in_progress"].includes(request.status));
        if (!approved) {
            stopWatchingLocation();
            setLocationUi({
                sharing: false,
                message: "You need an accepted or in-progress service request before live location sharing can begin.",
                tone: "neutral"
            });
            if (startLocationSharingBtn) startLocationSharingBtn.disabled = true;
            if (stopLocationSharingBtn) stopLocationSharingBtn.disabled = true;
            return;
        }

        setLocationUi({ sharing: false, message: "Ready to share your live location for an active job.", tone: "neutral" });
        if (startLocationSharingBtn) startLocationSharingBtn.disabled = false;
        if (stopLocationSharingBtn) stopLocationSharingBtn.disabled = false;
    } catch (error) {
        setLocationUi({
            sharing: false,
            message: error.message || "Unable to confirm your approved work status right now.",
            tone: "neutral"
        });
        if (startLocationSharingBtn) startLocationSharingBtn.disabled = true;
        if (stopLocationSharingBtn) stopLocationSharingBtn.disabled = true;
    }
}

if (locationBadge && locationStatusText && locationMessage) {
    refreshLocationAccessState();
}

if (welcomeText) {
    initializeDashboard();
}

// ===== Auth-aware header =====
function renderAuthNavigation() {
    const areas = document.querySelectorAll(".site-header .header-actions");
    if (!areas.length) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const name = localStorage.getItem("userName") || getDecodedTokenPayload().username || "Your account";
    areas.forEach((area) => {
        area.innerHTML = `<span class="header-user">${escapeHtml(name)}</span><a class="button ghost" href="dashboard.html">Dashboard</a><button type="button" class="button ghost" data-auth-logout>Log out</button>`;
        area.querySelector("[data-auth-logout]")?.addEventListener("click", logout);
    });
}

renderAuthNavigation();

// Keep journey dates in the future by default.
document.querySelectorAll('input[type="date"]').forEach((input) => {
    if (!input.min) input.min = new Date().toISOString().slice(0, 10);
});

// Explain an unreachable API before the user fills in a form.
if (document.body.classList.contains("auth-page")) {
    showServiceAvailabilityNotice(document.querySelector(".auth-main"));
}

window.addEventListener("beforeunload", () => {
    stopWatchingLocation();
});

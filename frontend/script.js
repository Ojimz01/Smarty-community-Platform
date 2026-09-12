const API_URL = "http://localhost:5000/api/auth";

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

        // Show loading state
        registerBtn.disabled = true;
        registerSpinner.style.display = "block";

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (res.ok && data.message?.toLowerCase().includes("success")) {
                showError("email", "email-error", "Registration successful! Redirecting...");
                setTimeout(() => window.location.href = "login.html", 1500);
            } else {
                showError("email", "email-error", data.message || "Registration failed. Try again.");
            }
        } catch (error) {
            showError("email", "email-error", "Network error. Please try again.");
        } finally {
            registerBtn.disabled = false;
            registerSpinner.style.display = "none";
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

        loginBtn.disabled = true;
        loginSpinner.style.display = "block";

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.message === "Login successful") {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userEmail", email);
                window.location.href = "dashboard.html";
            } else {
                showError("loginEmail", "email-error", data.message || "Invalid email or password");
            }
        } catch (error) {
            showError("loginEmail", "email-error", "Network error. Please try again.");
        } finally {
            loginBtn.disabled = false;
            loginSpinner.style.display = "none";
        }
    });
}

// ===== Service Catalog =====
const SERVICE_CATALOG = [
    {
        title: "Plumbing",
        description: "Fix leaks and pipes with expert plumbers.",
        icon: "assets/plumbing.svg"
    },
    {
        title: "Electrical",
        description: "Wiring and repairs by certified electricians.",
        icon: "assets/electrical.svg"
    },
    {
        title: "Carpentry",
        description: "Custom woodwork and furniture repairs.",
        icon: "assets/carpentry.svg"
    },
    {
        title: "Painting",
        description: "Interior and exterior painting services.",
        icon: "assets/painting.svg"
    },
    {
        title: "Cleaning",
        description: "Professional cleaning for homes and offices.",
        icon: "assets/cleaning.svg"
    },
    {
        title: "Landscaping",
        description: "Garden design and maintenance.",
        icon: "assets/landscaping.svg"
    }
];

const PROVIDER_DATA = [
    {
        name: "BlueWave Plumbing Co.",
        category: "Plumbing",
        location: "Brookside",
        description: "Emergency leak repairs, pipe replacements, and bathroom fixture installations for homes and rental properties.",
        rating: 4.9,
        availability: "Available today"
    },
    {
        name: "FlowRight Services",
        category: "Plumbing",
        location: "Maple Grove",
        description: "Fast, licensed plumbing support for kitchen, bathroom, and water heater maintenance with transparent pricing.",
        rating: 4.8,
        availability: "Bookings open this week"
    },
    {
        name: "Harbor Pipeworks",
        category: "Plumbing",
        location: "Riverside",
        description: "Residential and small-commercial plumbing solutions with same-day service and courteous technicians.",
        rating: 4.7,
        availability: "24/7 response"
    },
    {
        name: "VoltCore Electric",
        category: "Electrical",
        location: "North Hill",
        description: "Trusted residential electrical services including rewiring, lighting upgrades, and smart-home installations.",
        rating: 5.0,
        availability: "Available tomorrow"
    },
    {
        name: "Spark & Panel",
        category: "Electrical",
        location: "Oak Park",
        description: "Licensed electricians helping homeowners and landlords fix outages, install EV chargers, and improve safety.",
        rating: 4.9,
        availability: "Limited slots this week"
    },
    {
        name: "Circuit Haven",
        category: "Electrical",
        location: "Cedar Point",
        description: "Energy-efficient electrical solutions for homes, office spaces, and retail units with detailed inspections.",
        rating: 4.8,
        availability: "Open this afternoon"
    },
    {
        name: "Oak & Pine Custom Works",
        category: "Carpentry",
        location: "Willow Creek",
        description: "Custom shelving, cabinetry, and repair work designed to fit the flow of your home and daily routines.",
        rating: 4.9,
        availability: "Booked for 3 days"
    },
    {
        name: "TimberCraft Build",
        category: "Carpentry",
        location: "Sunnyside",
        description: "Skilled carpenters for framing, trim installations, furniture restoration, and interior upgrades.",
        rating: 4.8,
        availability: "Open next week"
    },
    {
        name: "Hearth & Wood Studio",
        category: "Carpentry",
        location: "Elm Ridge",
        description: "Interior woodwork, built-ins, and repair craftsmanship focused on durability and clean finishing.",
        rating: 4.7,
        availability: "Available this week"
    },
    {
        name: "ColorNest Pro",
        category: "Painting",
        location: "Stonebridge",
        description: "Interior and exterior painting with careful prep, durable finishes, and color consultation services.",
        rating: 4.9,
        availability: "Available today"
    },
    {
        name: "Canvas & Coats",
        category: "Painting",
        location: "Fern Valley",
        description: "Detailed painting for family homes, offices, and rental units using low-odor, modern finish options.",
        rating: 4.8,
        availability: "Bookings open"
    },
    {
        name: "FreshHue Crew",
        category: "Painting",
        location: "Silver Lake",
        description: "High-quality painting, accent walls, refresh projects, and exterior touch-ups for long-term curb appeal.",
        rating: 4.7,
        availability: "Open this weekend"
    },
    {
        name: "SparkleNest Cleaning",
        category: "Cleaning",
        location: "Lakeview",
        description: "Eco-conscious cleaning for homes, Airbnb stays, offices, and move-in or move-out refreshes.",
        rating: 5.0,
        availability: "Available today"
    },
    {
        name: "FreshFrame Home Care",
        category: "Cleaning",
        location: "Briarwood",
        description: "Routine and deep-cleaning services designed for busy households and property managers.",
        rating: 4.9,
        availability: "Open this week"
    },
    {
        name: "Neat & Bright Co.",
        category: "Cleaning",
        location: "Crescent Hills",
        description: "Reliable cleaning professionals focused on detail, consistency, and premium service standards.",
        rating: 4.8,
        availability: "Scheduling now"
    },
    {
        name: "GreenScape Studio",
        category: "Landscaping",
        location: "Hawthorn",
        description: "Garden design, lawn care, seasonal planting, and outdoor refresh projects tailored to your space.",
        rating: 4.9,
        availability: "Available this week"
    },
    {
        name: "Root & Bloom",
        category: "Landscaping",
        location: "Meadow Park",
        description: "Outdoor maintenance and design plans to improve curb appeal, drainage, and year-round greenery.",
        rating: 4.8,
        availability: "Open next week"
    },
    {
        name: "Lawn Logic Co.",
        category: "Landscaping",
        location: "Westfield",
        description: "Practical landscaping services for ongoing maintenance, planting, and property beautification.",
        rating: 4.7,
        availability: "Limited openings"
    }
];

// ===== Contact Form =====
const contactForm = document.querySelector(".contact-form");
const contactMessage = document.getElementById("contactMessage");
if (contactForm) {
    contactForm.addEventListener("submit", () => {
        if (contactMessage) {
            contactMessage.textContent = "Sending your message...";
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
    searchButton.addEventListener("click", submitSearch);
}

// ===== Search Results Page =====
const searchResults = document.getElementById("searchResults");
const searchQueryText = document.getElementById("searchQueryText");

if (searchResults && searchQueryText) {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    const normalizedQuery = query.trim().toLowerCase();

    searchQueryText.innerText = normalizedQuery
        ? `Showing results for "${query}"`
        : "Showing results for all services";

    const matches = SERVICE_CATALOG.filter((service) => {
        const searchTarget = `${service.title} ${service.description}`.toLowerCase();
        return normalizedQuery === "" || searchTarget.includes(normalizedQuery);
    });

    if (matches.length === 0) {
        searchResults.innerHTML = `
            <div class="result-card" style="grid-column: 1/-1;">
                <h4>No results found</h4>
                <p>Try searching for: plumbing, electrical, cleaning, painting, carpentry, or landscaping.</p>
                <a href="index.html" class="button">← Back to Home</a>
            </div>
        `;
    } else {
        searchResults.innerHTML = matches.map((service) => `
            <div class="result-card">
                <img src="${service.icon}" alt="${service.title}" width="80" height="80">
                <h4>${service.title}</h4>
                <p>${service.description}</p>
            </div>
        `).join("");
    }
}

// ===== Services Marketplace =====
const serviceCategoryTabs = document.getElementById("serviceCategoryTabs");
const serviceTitle = document.getElementById("serviceTitle");
const serviceSummary = document.getElementById("serviceSummary");
const providerGrid = document.getElementById("providerGrid");
const providerCount = document.getElementById("providerCount");

const renderServiceProviders = () => {
    if (!serviceCategoryTabs || !serviceTitle || !serviceSummary || !providerGrid) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || "Plumbing";
    const normalizedCategory = category.trim();

    const providers = PROVIDER_DATA.filter((provider) => provider.category === normalizedCategory);
    const categoryLabel = normalizedCategory || "Services";

    serviceTitle.innerText = `${categoryLabel} service providers`;
    serviceSummary.innerText = `Browse trusted ${categoryLabel.toLowerCase()} professionals nearby and request a quote in minutes.`;
    providerCount.innerText = `${providers.length} provider${providers.length === 1 ? "" : "s"} available`;

    const tabs = SERVICE_CATALOG.map((service) => `
        <a class="service-tab ${service.title === normalizedCategory ? "active" : ""}" href="services.html?category=${encodeURIComponent(service.title)}">${service.title}</a>
    `).join("");
    serviceCategoryTabs.innerHTML = tabs;

    if (providers.length === 0) {
        providerGrid.innerHTML = `
            <div class="provider-card no-results">
                <h4>No providers found</h4>
                <p>There are no listings yet for this category. Try another service from the menu above.</p>
            </div>
        `;
        return;
    }

    providerGrid.innerHTML = providers.map((provider) => {
        const stars = Array.from({ length: 5 }, (_, index) => index < Math.round(provider.rating) ? "★" : "☆").join("");

        return `
            <article class="provider-card">
                <div class="provider-header">
                    <div>
                        <span class="provider-tag">${provider.category}</span>
                        <h3>${provider.name}</h3>
                    </div>
                    <span class="provider-rating">${stars} <strong>${provider.rating.toFixed(1)}</strong></span>
                </div>
                <div class="provider-meta">
                    <span>${provider.location}</span>
                    <span>${provider.availability}</span>
                </div>
                <p>${provider.description}</p>
                <div class="provider-status-note">Location not currently shared — live tracking is only available for active approved service trips.</div>
                <div class="provider-actions">
                    <button type="button" class="provider-button secondary" data-provider="${provider.name}">View Profile</button>
                    <button type="button" class="provider-button primary" data-provider="${provider.name}">Request Service</button>
                </div>
            </article>
        `;
    }).join("");

    document.querySelectorAll(".provider-button").forEach((button) => {
        button.addEventListener("click", () => {
            const provider = button.dataset.provider || "this provider";
            const actionText = button.classList.contains("primary") ? "Service request sent" : "Profile opened";
            button.textContent = actionText;
            button.disabled = true;
            setTimeout(() => {
                button.textContent = button.classList.contains("primary") ? "Request Service" : "View Profile";
                button.disabled = false;
                alert(`${actionText} for ${provider}. This is a demo action in the development site.`);
            }, 250);
        });
    });
};

renderServiceProviders();

// ===== Dashboard =====
const welcomeText = document.getElementById("welcomeText");
if (welcomeText) {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");

    if (!token) {
        window.location.href = "login.html";
    } else {
        const emailName = email ? email.split("@")[0] : "community member";
        welcomeText.innerText = `Welcome, ${emailName}!`;
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
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
            : "Location sharing is off. This feature is only available for provider accounts while actively travelling to an accepted job.";
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

    const response = await fetch(`http://localhost:5000/api/location/${mode}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude })
    });

    const data = await response.json();

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
        const response = await fetch("http://localhost:5000/api/location/stop", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

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

if (locationBadge && locationStatusText && locationMessage) {
    const role = getDecodedTokenPayload().role || "customer";
    if (role !== "provider") {
        setLocationUi({
            sharing: false,
            message: "Live location sharing is currently reserved for provider accounts.",
            tone: "neutral"
        });
        startLocationSharingBtn.disabled = true;
        stopLocationSharingBtn.disabled = true;
    } else {
        setLocationUi({ sharing: false, message: "Ready to start sharing your live location.", tone: "neutral" });
    }
}

window.addEventListener("beforeunload", () => {
    stopWatchingLocation();
});

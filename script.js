const API_URL = (() => {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return isLocal ? "http://localhost:5000/api/auth" : `${window.location.origin}/api/auth`;
})();

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

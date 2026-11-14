/* Smart Community interactive demo.
   Runs entirely in the browser with sample data persisted to localStorage.
   It never calls the API, so the demo stays usable while account services are offline. */

const DEMO_STORAGE_KEY = "smartCommunityDemoV1";
const DEMO_PROVIDER = "Amara Okafor";

const demoStatusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Declined",
  cancelled: "Cancelled"
};

const demoListingsSeed = [
  {
    id: "tap-repair",
    name: "Tap repair & leak fix",
    category: "Plumbing",
    provider: "Amara Okafor",
    initials: "AO",
    price: 85,
    unit: "visit",
    rating: 4.8,
    ratingCount: 12,
    summary: "Dripping taps, worn washers, and slow drains sorted in one visit.",
    active: true
  },
  {
    id: "bathroom-reseal",
    name: "Bathroom re-seal",
    category: "Plumbing",
    provider: "Amara Okafor",
    initials: "AO",
    price: 140,
    unit: "fixed",
    rating: 4.7,
    ratingCount: 8,
    summary: "Fresh silicone sealing around baths, showers, and tiling edges.",
    active: true
  },
  {
    id: "leak-inspection",
    name: "Leak inspection",
    category: "Plumbing",
    provider: "Amara Okafor",
    initials: "AO",
    price: 45,
    unit: "fixed",
    rating: 4.9,
    ratingCount: 21,
    summary: "A careful check to find hidden leaks before they cause damage.",
    active: true
  },
  {
    id: "deep-clean",
    name: "Deep home cleaning",
    category: "Cleaning",
    provider: "Tunde Cleaning Co.",
    initials: "TC",
    price: 120,
    unit: "fixed",
    rating: 4.9,
    ratingCount: 31,
    summary: "A top-to-bottom clean for kitchens, bathrooms, and living spaces.",
    active: true
  },
  {
    id: "light-fitting",
    name: "Light fitting & wiring",
    category: "Electrical",
    provider: "Bright Spark Electrical",
    initials: "BS",
    price: 65,
    unit: "hour",
    rating: 4.7,
    ratingCount: 18,
    summary: "Safe fitting of lights, switches, and small wiring jobs.",
    active: true
  },
  {
    id: "garden-tidy",
    name: "Garden tidy & upkeep",
    category: "Landscaping",
    provider: "Green Care Landscaping",
    initials: "GC",
    price: 90,
    unit: "fixed",
    rating: 4.6,
    ratingCount: 9,
    summary: "Lawn care, pruning, and a general tidy-up for outdoor spaces.",
    active: true
  }
];

function demoDateFromToday(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function createDemoSeed() {
  const now = Date.now();
  return {
    role: "customer",
    favorites: ["tap-repair"],
    availability: true,
    requests: [
      {
        id: "req-1",
        listingId: "tap-repair",
        serviceName: "Tap repair & leak fix",
        category: "Plumbing",
        provider: "Amara Okafor",
        customer: "Ada N.",
        date: demoDateFromToday(1),
        time: "10:00",
        notes: "Kitchen mixer tap is dripping and the drain is slow.",
        status: "accepted",
        reviewed: false,
        messages: [{ from: "provider", text: "On my way — about 15 minutes out.", at: now - 1000 * 60 * 4 }]
      },
      {
        id: "req-2",
        listingId: "bathroom-reseal",
        serviceName: "Bathroom re-seal",
        category: "Plumbing",
        provider: "Amara Okafor",
        customer: "Bola A.",
        date: demoDateFromToday(2),
        time: "14:00",
        notes: "The silicone around the bath has gone black and needs replacing.",
        status: "pending",
        reviewed: false,
        messages: []
      },
      {
        id: "req-3",
        listingId: "leak-inspection",
        serviceName: "Leak inspection",
        category: "Plumbing",
        provider: "Amara Okafor",
        customer: "Chika E.",
        date: demoDateFromToday(0),
        time: "12:00",
        notes: "There is a damp patch on the hallway wall below the bathroom.",
        status: "in_progress",
        reviewed: false,
        messages: [{ from: "customer", text: "The key is with the neighbour in flat 2.", at: now - 1000 * 60 * 20 }]
      },
      {
        id: "req-4",
        listingId: "tap-repair",
        serviceName: "Tap repair & leak fix",
        category: "Plumbing",
        provider: "Amara Okafor",
        customer: "Dara O.",
        date: demoDateFromToday(-3),
        time: "09:00",
        notes: "Outside tap would not turn off properly.",
        status: "completed",
        reviewed: true,
        messages: []
      },
      {
        id: "req-5",
        listingId: "deep-clean",
        serviceName: "Deep home cleaning",
        category: "Cleaning",
        provider: "Tunde Cleaning Co.",
        customer: "You",
        date: demoDateFromToday(4),
        time: "09:00",
        notes: "Two-bedroom flat before guests arrive. Kitchen and bathroom need the most attention.",
        status: "pending",
        reviewed: false,
        messages: []
      },
      {
        id: "req-6",
        listingId: "light-fitting",
        serviceName: "Light fitting & wiring",
        category: "Electrical",
        provider: "Bright Spark Electrical",
        customer: "You",
        date: demoDateFromToday(-6),
        time: "16:00",
        notes: "Replaced the hallway light fitting and checked the switch.",
        status: "completed",
        reviewed: false,
        messages: []
      }
    ],
    reviews: [
      {
        author: "Dara O.",
        rating: 5,
        text: "Fixed the leak in under an hour and left everything tidy.",
        service: "Tap repair & leak fix"
      },
      {
        author: "Femi A.",
        rating: 4,
        text: "Clear quote and good communication from start to finish.",
        service: "Bathroom re-seal"
      }
    ],
    listings: demoListingsSeed.map((listing) => ({ ...listing }))
  };
}

function loadDemoState() {
  try {
    const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!stored) return createDemoSeed();
    const parsed = JSON.parse(stored);
    if (!parsed || !Array.isArray(parsed.requests) || !Array.isArray(parsed.listings)) {
      return createDemoSeed();
    }
    return {
      ...createDemoSeed(),
      ...parsed,
      requests: parsed.requests,
      listings: parsed.listings
    };
  } catch (error) {
    return createDemoSeed();
  }
}

let demoState = loadDemoState();
const openDemoThreads = new Set();
let demoToastTimer = null;

function saveDemoState() {
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoState));
  } catch (error) {
    /* Storage can be unavailable in private mode; the demo still works for this visit. */
  }
}

function escapeDemo(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDemoDate(value) {
  if (!value) return "Date to be agreed";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function formatDemoPrice(listing) {
  const symbol = "$";
  const unitLabel = { fixed: "fixed", hour: "per hour", visit: "per visit" }[listing.unit] || listing.unit;
  return `${symbol}${Number(listing.price).toFixed(0)} ${unitLabel}`;
}

function showDemoToast(message) {
  const toast = document.getElementById("demoToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  if (demoToastTimer) window.clearTimeout(demoToastTimer);
  demoToastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function demoProviderRequests() {
  return demoState.requests.filter((request) => request.provider === DEMO_PROVIDER);
}

function renderDemoStats() {
  const open = document.getElementById("demoStatOpen");
  const active = document.getElementById("demoStatActive");
  const done = document.getElementById("demoStatDone");
  const openLabel = document.getElementById("demoStatOpenLabel");
  const activeLabel = document.getElementById("demoStatActiveLabel");
  const isProvider = demoState.role === "provider";
  const requests = isProvider ? demoProviderRequests() : demoState.requests;

  if (openLabel) openLabel.textContent = isProvider ? "New requests" : "Open requests";
  if (activeLabel) activeLabel.textContent = isProvider ? "Active jobs" : "Saved providers";

  if (open) {
    open.textContent = isProvider
      ? requests.filter((request) => request.status === "pending").length
      : requests.filter((request) => ["pending", "accepted", "in_progress"].includes(request.status)).length;
  }
  if (active) {
    active.textContent = isProvider
      ? requests.filter((request) => ["accepted", "in_progress"].includes(request.status)).length
      : demoState.favorites.length;
  }
  if (done) {
    done.textContent = requests.filter((request) => request.status === "completed").length;
  }
}

function renderDemoListings() {
  const container = document.getElementById("demoListings");
  const select = document.getElementById("demoService");
  if (!container) return;

  const activeListings = demoState.listings.filter((listing) => listing.active);
  container.innerHTML = activeListings.length
    ? activeListings.map((listing) => {
      const saved = demoState.favorites.includes(listing.id);
      return `<article class="demo-listing">
        <div class="demo-listing-top">
          <span class="demo-avatar" aria-hidden="true">${escapeDemo(listing.initials)}</span>
          <span class="demo-rating">${Number(listing.rating).toFixed(1)} / 5 <small>(${listing.ratingCount})</small></span>
        </div>
        <div>
          <span class="demo-category">${escapeDemo(listing.category)}</span>
          <h3>${escapeDemo(listing.name)}</h3>
          <p>${escapeDemo(listing.summary)}</p>
        </div>
        <div class="demo-listing-meta">
          <span>${escapeDemo(listing.provider)}</span>
          <strong>${escapeDemo(formatDemoPrice(listing))}</strong>
        </div>
        <div class="demo-listing-actions">
          <button type="button" class="mini-button" data-demo-action="request" data-id="${escapeDemo(listing.id)}">Request</button>
          <button type="button" class="mini-button secondary" data-demo-action="save" data-id="${escapeDemo(listing.id)}" aria-pressed="${saved}">${saved ? "Saved" : "Save"}</button>
        </div>
      </article>`;
    }).join("")
    : "<p class=\"demo-empty\">All sample listings are paused. Reset the demo or reopen a listing in the provider view.</p>";

  if (select) {
    select.innerHTML = activeListings.map((listing) => (
      `<option value="${escapeDemo(listing.id)}">${escapeDemo(listing.name)} — ${escapeDemo(listing.provider)}</option>`
    )).join("");
    select.disabled = !activeListings.length;
  }
}

function renderDemoRequestCard(request, role) {
  const isProvider = role === "provider";
  const counterpart = isProvider ? request.customer : request.provider;
  const counterpartLabel = isProvider ? "Customer" : "Provider";
  const canCancel = ["pending", "accepted"].includes(request.status);
  let actions = "";
  if (isProvider) {
    if (request.status === "pending") {
      actions = `<button type="button" class="mini-button accept" data-demo-action="accept" data-id="${escapeDemo(request.id)}">Accept</button>
        <button type="button" class="mini-button reject" data-demo-action="reject" data-id="${escapeDemo(request.id)}">Decline</button>`;
    } else if (request.status === "accepted") {
      actions = `<button type="button" class="mini-button accept" data-demo-action="start" data-id="${escapeDemo(request.id)}">Start job</button>`;
    } else if (request.status === "in_progress") {
      actions = `<button type="button" class="mini-button accept" data-demo-action="complete" data-id="${escapeDemo(request.id)}">Mark complete</button>`;
    }
  } else {
    if (canCancel) {
      actions = `<button type="button" class="mini-button reject" data-demo-action="cancel" data-id="${escapeDemo(request.id)}">Cancel request</button>`;
    }
    if (request.status === "completed" && !request.reviewed) {
      actions += `<details class="demo-review">
        <summary>Leave a review</summary>
        <form data-demo-review="${escapeDemo(request.id)}" class="demo-review-form">
          <label>Rating
            <select name="rating" required>
              <option value="">Choose a rating</option>
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Average</option>
              <option value="2">2 — Poor</option>
              <option value="1">1 — Very poor</option>
            </select>
          </label>
          <label>Comment
            <textarea name="comment" rows="2" maxlength="400" placeholder="How did it go?"></textarea>
          </label>
          <button type="submit" class="mini-button accept">Submit review</button>
        </form>
      </details>`;
    } else if (request.status === "completed" && request.reviewed) {
      actions += "<small class=\"demo-reviewed\">Review submitted — thank you.</small>";
    }
  }

  const messages = request.messages || [];
  const thread = `<details class="demo-thread" data-thread="${escapeDemo(request.id)}" ${openDemoThreads.has(request.id) ? "open" : ""}>
    <summary>Messages (${messages.length})</summary>
    <ul>
      ${messages.length
        ? messages.map((message) => `<li class="${message.from === role ? "sent" : "received"}">
            <strong>${message.from === role ? "You" : escapeDemo(counterpart)}</strong>
            <p>${escapeDemo(message.text)}</p>
          </li>`).join("")
        : "<li>No messages yet. Start the conversation.</li>"}
    </ul>
    <form class="demo-message-form" data-demo-message="${escapeDemo(request.id)}">
      <label class="sr-only" for="demo-message-${escapeDemo(request.id)}">Write a message</label>
      <input id="demo-message-${escapeDemo(request.id)}" name="body" type="text" maxlength="300" placeholder="Write a message…" required>
      <button type="submit" class="mini-button">Send</button>
    </form>
    <small class="demo-thread-note">Demo messages stay in this browser.</small>
  </details>`;

  return `<li class="demo-request">
    <div class="demo-request-head">
      <div>
        <strong>${escapeDemo(request.serviceName)}</strong>
        <span>${counterpartLabel}: ${escapeDemo(counterpart)} · ${escapeDemo(request.category)}</span>
      </div>
      <span class="status-pill status-${escapeDemo(request.status)}">${escapeDemo(demoStatusLabels[request.status] || request.status)}</span>
    </div>
    <p>${escapeDemo(request.notes)}</p>
    <div class="demo-request-meta">
      <span>${escapeDemo(formatDemoDate(request.date))} at ${escapeDemo(request.time || "a time to agree")}</span>
    </div>
    ${thread}
    <div class="demo-actions">${actions}</div>
  </li>`;
}

function renderDemoCustomerRequests() {
  const list = document.getElementById("demoCustomerRequests");
  const count = document.getElementById("demoRequestCount");
  if (!list) return;
  const requests = demoState.requests;
  if (count) count.textContent = `${requests.length} total`;
  list.innerHTML = requests.length
    ? requests.map((request) => renderDemoRequestCard(request, "customer")).join("")
    : "<li class=\"demo-empty\">No requests yet. Send one using the form above.</li>";
}

function renderDemoProviderRequests() {
  const list = document.getElementById("demoProviderRequests");
  const count = document.getElementById("demoProviderRequestCount");
  if (!list) return;
  const requests = demoProviderRequests();
  if (count) count.textContent = `${requests.length} total`;
  list.innerHTML = requests.length
    ? requests.map((request) => renderDemoRequestCard(request, "provider")).join("")
    : "<li class=\"demo-empty\">No incoming requests right now. Send one from the customer view.</li>";
}

function renderDemoFavorites() {
  const list = document.getElementById("demoFavorites");
  if (!list) return;
  const saved = demoState.listings.filter((listing) => demoState.favorites.includes(listing.id));
  list.innerHTML = saved.length
    ? saved.map((listing) => `<li>
        <div><strong>${escapeDemo(listing.name)}</strong><small>${escapeDemo(listing.provider)} · ${escapeDemo(formatDemoPrice(listing))}</small></div>
        <button type="button" class="mini-button reject" data-demo-action="remove-favorite" data-id="${escapeDemo(listing.id)}">Remove</button>
      </li>`).join("")
    : "<li class=\"demo-empty\">No saved providers yet. Use Save on a listing.</li>";
}

function renderDemoProviderListings() {
  const list = document.getElementById("demoProviderListings");
  if (!list) return;
  const listings = demoState.listings.filter((listing) => listing.provider === DEMO_PROVIDER);
  list.innerHTML = listings.map((listing) => `<li class="demo-provider-listing">
    <div>
      <strong>${escapeDemo(listing.name)}</strong>
      <small>${escapeDemo(formatDemoPrice(listing))} · ${listing.active ? "Published" : "Paused"}</small>
    </div>
    <button type="button" class="mini-button ${listing.active ? "reject" : "accept"}" data-demo-action="toggle-listing" data-id="${escapeDemo(listing.id)}">${listing.active ? "Pause" : "Publish"}</button>
  </li>`).join("");
}

function renderDemoReviews() {
  const list = document.getElementById("demoReviews");
  if (!list) return;
  list.innerHTML = demoState.reviews.length
    ? demoState.reviews.map((review) => `<li class="demo-review-item">
        <div class="demo-review-head"><strong>${escapeDemo(review.author)}</strong><span>${Number(review.rating)} / 5</span></div>
        <p>${escapeDemo(review.text || "No written comment.")}</p>
        <small>${escapeDemo(review.service)}</small>
      </li>`).join("")
    : "<li class=\"demo-empty\">No reviews yet. Complete a job in the provider view, then review it as the customer.</li>";
}

function renderDemoAvailability() {
  const badge = document.getElementById("demoAvailabilityBadge");
  const note = document.getElementById("demoAvailabilityNote");
  const button = document.getElementById("demoAvailabilityBtn");
  const accepting = demoState.availability;
  if (badge) {
    badge.textContent = accepting ? "Accepting" : "Paused";
    badge.className = `status-pill ${accepting ? "status-accepted" : "status-rejected"}`;
  }
  if (note) {
    note.textContent = accepting
      ? "Customers can send you new requests."
      : "Your profile is paused. New requests to Amara will be blocked in this demo.";
  }
  if (button) button.textContent = accepting ? "Pause new requests" : "Resume new requests";
}

function renderDemo() {
  renderDemoStats();
  renderDemoListings();
  renderDemoCustomerRequests();
  renderDemoProviderRequests();
  renderDemoFavorites();
  renderDemoProviderListings();
  renderDemoReviews();
  renderDemoAvailability();
}

function applyDemoRole(role, { focusTab = false } = {}) {
  const resolved = role === "provider" ? "provider" : "customer";
  demoState.role = resolved;
  saveDemoState();
  const customerTab = document.getElementById("tabCustomer");
  const providerTab = document.getElementById("tabProvider");
  const customerPanel = document.getElementById("customerDemo");
  const providerPanel = document.getElementById("providerDemo");
  const isCustomer = resolved === "customer";

  if (customerTab) customerTab.setAttribute("aria-selected", String(isCustomer));
  if (providerTab) providerTab.setAttribute("aria-selected", String(!isCustomer));
  if (customerPanel) {
    customerPanel.hidden = !isCustomer;
    customerPanel.classList.toggle("hidden", !isCustomer);
  }
  if (providerPanel) {
    providerPanel.hidden = isCustomer;
    providerPanel.classList.toggle("hidden", isCustomer);
  }
  if (focusTab) (isCustomer ? customerTab : providerTab)?.focus();
  renderDemoStats();
}

function setDemoFormMessage(text, tone = "") {
  const message = document.getElementById("demoFormMessage");
  if (!message) return;
  message.textContent = text;
  message.classList.remove("success", "error");
  if (tone) message.classList.add(tone);
}

function defaultDemoDate() {
  const input = document.getElementById("demoDate");
  if (!input) return;
  const today = new Date().toISOString().slice(0, 10);
  input.min = today;
  if (!input.value) input.value = demoDateFromToday(1);
}

document.querySelectorAll("[data-demo-role]").forEach((tab) => {
  tab.addEventListener("click", () => applyDemoRole(tab.dataset.demoRole));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextRole = demoState.role === "customer" ? "provider" : "customer";
    applyDemoRole(nextRole, { focusTab: true });
  });
});

document.getElementById("resetDemo")?.addEventListener("click", () => {
  if (!window.confirm("Reset the demo to its starting sample data?")) return;
  demoState = createDemoSeed();
  openDemoThreads.clear();
  saveDemoState();
  applyDemoRole("customer");
  renderDemo();
  setDemoFormMessage("Demo data reset.", "success");
  showDemoToast("Demo reset to its starting state.");
});

document.getElementById("demoRequestForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const select = document.getElementById("demoService");
  const listing = demoState.listings.find((item) => item.id === select?.value);
  if (!listing) {
    setDemoFormMessage("Choose a service to continue.", "error");
    return;
  }
  if (listing.provider === DEMO_PROVIDER && !demoState.availability) {
    setDemoFormMessage("Amara has paused new requests in this demo. Choose another provider or resume availability in the provider view.", "error");
    return;
  }
  const notes = document.getElementById("demoNotes").value.trim();
  if (notes.length < 10) {
    setDemoFormMessage("Add at least 10 characters about the job.", "error");
    return;
  }
  const request = {
    id: `req-${Date.now()}`,
    listingId: listing.id,
    serviceName: listing.name,
    category: listing.category,
    provider: listing.provider,
    customer: "You",
    date: document.getElementById("demoDate").value || demoDateFromToday(1),
    time: document.getElementById("demoTime").value,
    notes,
    status: "pending",
    reviewed: false,
    messages: []
  };
  demoState.requests.unshift(request);
  saveDemoState();
  event.currentTarget.reset();
  defaultDemoDate();
  renderDemo();
  setDemoFormMessage(`Demo request sent to ${listing.provider} — it now appears in your requests.`, "success");
  showDemoToast("Demo request created.");
  document.querySelector(".demo-activity-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-demo-action]");
  if (!trigger) return;
  const action = trigger.dataset.demoAction;
  const id = trigger.dataset.id;
  const request = demoState.requests.find((item) => item.id === id);
  const listing = demoState.listings.find((item) => item.id === id);

  if (action === "save" && listing) {
    const index = demoState.favorites.indexOf(listing.id);
    if (index >= 0) demoState.favorites.splice(index, 1);
    else demoState.favorites.push(listing.id);
    saveDemoState();
    renderDemo();
    showDemoToast(index >= 0 ? "Removed from saved providers." : "Provider saved.");
    return;
  }

  if (action === "request" && listing) {
    const select = document.getElementById("demoService");
    if (select) select.value = listing.id;
    document.getElementById("demoNotes")?.focus();
    document.querySelector(".demo-request-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setDemoFormMessage(`Requesting ${listing.name} from ${listing.provider} — add your project details.`, "success");
    return;
  }

  if (action === "remove-favorite" && listing) {
    demoState.favorites = demoState.favorites.filter((item) => item !== listing.id);
    saveDemoState();
    renderDemo();
    showDemoToast("Removed from saved providers.");
    return;
  }

  if (action === "toggle-listing" && listing) {
    listing.active = !listing.active;
    saveDemoState();
    renderDemo();
    showDemoToast(listing.active ? `${listing.name} is published.` : `${listing.name} is paused.`);
    return;
  }

  if (!request) return;

  if (action === "cancel") {
    if (!window.confirm("Cancel this demo request?")) return;
    request.status = "cancelled";
    showDemoToast("Demo request cancelled.");
  } else if (action === "accept" && request.status === "pending") {
    request.status = "accepted";
    showDemoToast("Request accepted. The customer can see the update.");
  } else if (action === "reject" && request.status === "pending") {
    request.status = "rejected";
    showDemoToast("Request declined.");
  } else if (action === "start" && request.status === "accepted") {
    request.status = "in_progress";
    showDemoToast("Job started.");
  } else if (action === "complete" && request.status === "in_progress") {
    request.status = "completed";
    showDemoToast("Job completed. The customer can now leave a review.");
  } else {
    return;
  }
  saveDemoState();
  renderDemo();
});

document.addEventListener("submit", (event) => {
  const messageForm = event.target.closest("form[data-demo-message]");
  if (messageForm) {
    event.preventDefault();
    const request = demoState.requests.find((item) => item.id === messageForm.dataset.demoMessage);
    const input = messageForm.querySelector('input[name="body"]');
    const body = input ? input.value.trim() : "";
    if (!request || !body) return;
    request.messages = request.messages || [];
    request.messages.push({ from: demoState.role, text: body, at: Date.now() });
    openDemoThreads.add(request.id);
    saveDemoState();
    renderDemo();
    showDemoToast("Demo message added.");
    return;
  }

  const reviewForm = event.target.closest("form[data-demo-review]");
  if (reviewForm) {
    event.preventDefault();
    const request = demoState.requests.find((item) => item.id === reviewForm.dataset.demoReview);
    const formData = new FormData(reviewForm);
    const rating = Number(formData.get("rating"));
    if (!request || !rating) return;
    request.reviewed = true;
    demoState.reviews.unshift({
      author: "You",
      rating,
      text: String(formData.get("comment") || "").trim(),
      service: request.serviceName
    });
    saveDemoState();
    renderDemo();
    showDemoToast("Review added to the provider profile.");
  }
});

document.addEventListener("toggle", (event) => {
  const details = event.target;
  if (!details.matches || !details.matches("details.demo-thread")) return;
  if (details.open) openDemoThreads.add(details.dataset.thread);
  else openDemoThreads.delete(details.dataset.thread);
}, true);

document.getElementById("demoAvailabilityBtn")?.addEventListener("click", () => {
  demoState.availability = !demoState.availability;
  saveDemoState();
  renderDemoAvailability();
  showDemoToast(demoState.availability ? "You are accepting new requests." : "New requests are paused.");
});

const requestedRole = new URLSearchParams(window.location.search).get("role");
defaultDemoDate();
applyDemoRole(requestedRole || demoState.role);
renderDemo();

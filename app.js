const seedStays = [
  { id: "willow-house", name: "The Willow House", area: "Indiranagar", address: "12th Main, HAL 2nd Stage, Bengaluru", distance: "0.8 km from Indiranagar Metro", rent: 14500, deposit: 30000, sharing: 2, gender: "women", vacancies: 3, rating: 4.8, reviews: 36, amenities: ["Wi-Fi", "Food", "Laundry", "AC"], image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85", images: 8, description: "A bright, easygoing home tucked into a leafy lane. Find a sunny balcony, home-cooked meals and a friendly house team that makes settling in feel simple." },
  { id: "mango-tree", name: "Mango Tree Living", area: "Koramangala", address: "5th Block, Koramangala, Bengaluru", distance: "1.1 km from Forum Mall", rent: 11000, deposit: 22000, sharing: 3, gender: "any", vacancies: 2, rating: 4.7, reviews: 28, amenities: ["Wi-Fi", "Food", "Laundry", "Parking"], image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85", images: 12, description: "Room to breathe, people to share a meal with and Koramangala just outside your door. A relaxed community stay with flexible meal plans." },
  { id: "green-door", name: "The Green Door PG", area: "HSR Layout", address: "Sector 2, HSR Layout, Bengaluru", distance: "0.6 km from 27th Main Road", rent: 9500, deposit: 19000, sharing: 2, gender: "men", vacancies: 4, rating: 4.6, reviews: 19, amenities: ["Wi-Fi", "Food", "AC", "Parking"], image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85", images: 7, description: "A comfortable, well-kept place in the heart of HSR. Easy access to daily essentials, shared spaces that stay tidy and a responsive on-site manager." },
  { id: "little-nest", name: "Little Nest Co-living", area: "Whitefield", address: "Nallurhalli, Whitefield, Bengaluru", distance: "1.4 km from Nallurhalli Metro", rent: 18000, deposit: 36000, sharing: 1, gender: "women", vacancies: 1, rating: 4.9, reviews: 42, amenities: ["Wi-Fi", "Food", "Laundry", "AC", "Parking"], image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85", images: 10, description: "A little extra breathing room, with a private balcony and thoughtful shared spaces. Ideal for someone who likes a quiet reset after a busy day." },
  { id: "terrace-house", name: "Terrace House", area: "Jayanagar", address: "4th Block, Jayanagar, Bengaluru", distance: "0.5 km from Jayanagar Metro", rent: 12500, deposit: 25000, sharing: 2, gender: "any", vacancies: 2, rating: 4.5, reviews: 14, amenities: ["Wi-Fi", "Laundry", "Parking"], image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=900&q=85", images: 6, description: "A calm, sunlit home in one of Bengaluru's most walkable neighbourhoods. Nearby parks, good coffee and a roof terrace for slow Sunday mornings." },
  { id: "copper-kettle", name: "Copper Kettle Homes", area: "Marathahalli", address: "AECS Layout, Marathahalli, Bengaluru", distance: "1.0 km from Kundalahalli Gate", rent: 8500, deposit: 17000, sharing: 4, gender: "men", vacancies: 3, rating: 4.4, reviews: 22, amenities: ["Wi-Fi", "Food", "Laundry"], image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85", images: 9, description: "Friendly, no-fuss living close to the ORR tech parks. All the everyday essentials are sorted, with a shared kitchen and dependable Wi-Fi." }
];

const state = {
  stays: [...seedStays],
  favorites: [],
  owned: [],
  compare: [],
  view: "explore",
  gender: "any",
  user: null,
  location: "",
  sharing: "any",
  budget: 25000,
  amenities: [],
  csrf: null,
  enquiries: []
};

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const money = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

async function api(path, options = {}) {
  const method = options.method || "GET";
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!state.csrf) await fetchCsrf();
    headers.set(state.csrf.headerName, state.csrf.token);
  }
  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw Object.assign(new Error("Please sign in with the right account type to continue."), { status: response.status });
    throw Object.assign(new Error(data?.detail || "Something went wrong. Please try again."), { status: response.status });
  }
  return data;
}

async function fetchCsrf() {
  const response = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Could not start a secure session.");
  state.csrf = await response.json();
  return state.csrf;
}

async function loadState() {
  try {
    await fetchCsrf();
    state.user = await api("/api/auth/me");
    const listings = await api("/api/listings");
    state.stays = Array.isArray(listings) ? listings : [];
    if (state.user?.role === "STUDENT") {
      const favourites = await api("/api/favourites");
      state.favorites = favourites.map((stay) => stay.id);
    }
    if (state.user?.role === "OWNER") {
      state.owned = await api("/api/owner/listings");
      state.enquiries = await api("/api/owner/enquiries");
    }
  } catch (error) {
    showToast(error.message || "Could not connect to the database.");
  }
  if (state.user) byId("profile-button").textContent = state.user.fullName.trim().charAt(0).toUpperCase();
  renderExplore();
}

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function renderStays(stays, container, { ownerTools = false } = {}) {
  container.innerHTML = stays.map((stay, index) => `
    <article class="stay-card" style="animation-delay:${Math.min(index * 55, 250)}ms">
      <div class="stay-photo" data-detail="${escapeHtml(stay.id)}">
        <img src="${escapeHtml(stay.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85")}" alt="Room at ${escapeHtml(stay.name)}" loading="lazy" />
        <span class="verified-badge">${icon("badge-check")} Verified stay</span>
        <button class="heart-button ${state.favorites.includes(stay.id) ? "saved" : ""}" data-favorite="${escapeHtml(stay.id)}" aria-label="${state.favorites.includes(stay.id) ? "Remove from saved" : "Save"} ${escapeHtml(stay.name)}" title="${state.favorites.includes(stay.id) ? "Remove from saved" : "Save stay"}">${icon("heart")}</button>
        <span class="photo-count">${icon("images")} ${Number(stay.images) || 1}</span>
      </div>
      <div class="stay-info">
        <div class="stay-topline"><div><h3 class="stay-name" data-detail="${escapeHtml(stay.id)}">${escapeHtml(stay.name)}</h3><p class="stay-area">${icon("map-pin")} ${escapeHtml(stay.area)} · ${escapeHtml(stay.distance || "Bengaluru")}</p></div><span class="rating">${icon("star")} ${Number(stay.rating || 4.5).toFixed(1)} <span>(${Number(stay.reviews || 0)})</span></span></div>
        <div class="stay-tags"><span class="stay-tag">${Number(stay.sharing)} sharing</span><span class="stay-tag">${escapeHtml(stay.gender === "any" ? "All genders" : stay.gender === "women" ? "Women only" : "Men only")}</span><span class="stay-tag">${Number(stay.vacancies)} beds left</span>${stay.amenities.slice(0, 2).map((item) => `<span class="stay-tag">${escapeHtml(item)}</span>`).join("")}</div>
        <div class="stay-bottom"><div class="stay-price-copy"><div class="stay-price"><strong>${money(stay.rent)}</strong><span>/ month</span></div><span class="deposit-note">${money(stay.deposit)} deposit</span></div><div class="stay-actions">${ownerTools ? `<label class="compare-check"><input type="checkbox" data-compare="${escapeHtml(stay.id)}" ${state.compare.includes(stay.id) ? "checked" : ""} /> Compare</label>` : `<label class="compare-check"><input type="checkbox" data-compare="${escapeHtml(stay.id)}" ${state.compare.includes(stay.id) ? "checked" : ""} /> Compare</label>`}<button class="details-button" data-detail="${escapeHtml(stay.id)}">View details ${icon("arrow-up-right")}</button></div></div>
      </div>
    </article>`).join("");
  refreshIcons();
}

function getFilteredStays() {
  const query = state.location.trim().toLowerCase();
  const filtered = state.stays.filter((stay) => {
    const matchQuery = !query || `${stay.name} ${stay.area} ${stay.address} ${stay.distance}`.toLowerCase().includes(query);
    const matchBudget = Number(stay.rent) <= state.budget;
    const matchSharing = state.sharing === "any" || String(stay.sharing) === state.sharing;
    const matchGender = state.gender === "any" || stay.gender === state.gender || stay.gender === "any";
    const matchAmenities = state.amenities.every((amenity) => stay.amenities.includes(amenity));
    return matchQuery && matchBudget && matchSharing && matchGender && matchAmenities && stay.available !== false;
  });
  const sort = byId("sort-select").value;
  if (sort === "price-low") filtered.sort((a, b) => a.rent - b.rent);
  if (sort === "price-high") filtered.sort((a, b) => b.rent - a.rent);
  return filtered;
}

function renderExplore() {
  const stays = getFilteredStays();
  renderStays(stays, byId("listing-list"));
  byId("result-count").textContent = `${stays.length} ${stays.length === 1 ? "stay" : "stays"}`;
  byId("results-title").textContent = state.location ? `PGs near ${state.location}` : "PGs in Bengaluru";
  byId("results-subtitle").textContent = state.location ? "A few good places to start your search." : "Handpicked stays in the city's most-loved neighbourhoods.";
  byId("empty-state").classList.toggle("hidden", stays.length !== 0);
  byId("listing-list").classList.toggle("hidden", stays.length === 0 || !byId("map-panel").classList.contains("hidden"));
  updateCounts();
  renderCompareDock();
}

function renderSaved() {
  const stays = state.stays.filter((stay) => state.favorites.includes(stay.id));
  renderStays(stays, byId("saved-list"));
  byId("saved-empty").classList.toggle("hidden", stays.length > 0);
  byId("saved-list").classList.toggle("hidden", stays.length === 0);
}

function renderOwnerDashboard() {
  const ownedStays = state.owned;
  byId("owner-empty").classList.toggle("hidden", ownedStays.length > 0);
  byId("owner-summary").classList.toggle("hidden", ownedStays.length === 0);
  byId("owner-summary").innerHTML = `<div class="summary-cell"><span>Active listings</span><strong>${ownedStays.filter((stay) => stay.available !== false).length}</strong></div><div class="summary-cell"><span>Beds available</span><strong>${ownedStays.reduce((sum, stay) => sum + Number(stay.vacancies), 0)}</strong></div><div class="summary-cell"><span>Visit requests</span><strong>${state.enquiries.length}</strong></div>`;
  byId("owner-listings").innerHTML = ownedStays.map((stay) => `<article class="owner-listing-row"><img src="${escapeHtml(stay.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85")}" alt="${escapeHtml(stay.name)}" /><div class="owner-listing-copy"><h3>${escapeHtml(stay.name)}</h3><p>${escapeHtml(stay.area)} · ${Number(stay.sharing)} sharing · ${money(stay.rent)}/month</p><div class="owner-listing-meta"><span>${Number(stay.vacancies)} beds available</span><span>${escapeHtml(stay.contactPhone || "Contact details added")}</span></div></div><div class="owner-listing-controls"><label class="availability-toggle"><input type="checkbox" data-availability="${escapeHtml(stay.id)}" ${stay.available !== false ? "checked" : ""} /> Available</label><button class="icon-button danger" data-delete="${escapeHtml(stay.id)}" aria-label="Delete ${escapeHtml(stay.name)}" title="Delete listing">${icon("trash-2")}</button></div></article>`).join("");
  refreshIcons();
}

function updateCounts() {
  byId("saved-count").textContent = state.favorites.length;
}

function renderCompareDock() {
  byId("compare-count").textContent = state.compare.length;
  byId("compare-dock").classList.toggle("hidden", state.compare.length < 2);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function setView(view) {
  if (view === "saved" && state.user?.role !== "STUDENT") {
    openLogin("STUDENT");
    return;
  }
  if (view === "listings" && state.user?.role !== "OWNER") {
    openLogin("OWNER");
    return;
  }
  state.view = view;
  byId("explore-view").classList.toggle("hidden", view !== "explore");
  byId("saved-view").classList.toggle("hidden", view !== "saved");
  byId("listings-view").classList.toggle("hidden", view !== "listings");
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  if (view === "explore") renderExplore();
  if (view === "saved") renderSaved();
  if (view === "listings") renderOwnerDashboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("visible"), 2300);
}

function showModal(content) {
  const layer = byId("modal-layer");
  layer.innerHTML = content;
  layer.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  refreshIcons();
  layer.querySelector(".modal-close")?.focus();
}

function openLogin(role = "STUDENT", mode = "login") {
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login.html?role=${role.toLowerCase()}&mode=${mode}&next=${encodeURIComponent(next)}`);
}

function openAccountMenu() {
  if (!state.user) {
    openLogin("STUDENT");
    return;
  }
  showModal(`<div class="modal compact-modal"><div class="modal-head"><div><h2>Your account</h2><p>${escapeHtml(state.user.role === "OWNER" ? "PG owner" : "PG seeker")}</p></div><button class="modal-close" aria-label="Close" title="Close">${icon("x")}</button></div><div class="login-content"><strong>${escapeHtml(state.user.fullName)}</strong><p class="upload-note">${escapeHtml(state.user.email)} · ${escapeHtml(state.user.phone)}</p><button class="button-secondary" id="sign-out" style="margin-top:16px">${icon("log-out")} Sign out</button></div></div>`);
}

function closeModal() {
  byId("modal-layer").classList.add("hidden");
  byId("modal-layer").innerHTML = "";
  document.body.style.overflow = "";
}

function openDetails(id) {
  const stay = state.stays.find((item) => item.id === id);
  if (!stay) return;
  showModal(`<div class="modal"><div class="detail-hero"><img src="${escapeHtml(stay.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85")}" alt="Room at ${escapeHtml(stay.name)}" /><span class="verified-badge">${icon("badge-check")} Verified stay</span></div><div class="detail-body"><div class="detail-title-row"><div><h2>${escapeHtml(stay.name)}</h2><p>${icon("map-pin")} ${escapeHtml(stay.address || stay.area)} · ${escapeHtml(stay.distance || "Bengaluru")}</p></div><div class="detail-price"><strong>${money(stay.rent)}</strong><span>per person / month</span></div></div><div class="detail-facts"><div class="detail-fact"><span>ROOM TYPE</span><strong>${Number(stay.sharing)} sharing</strong></div><div class="detail-fact"><span>DEPOSIT</span><strong>${money(stay.deposit)}</strong></div><div class="detail-fact"><span>VACANCIES</span><strong>${Number(stay.vacancies)} beds</strong></div><div class="detail-fact"><span>GUESTS</span><strong>${escapeHtml(stay.gender === "any" ? "All genders" : stay.gender === "women" ? "Women only" : "Men only")}</strong></div></div><h3 class="detail-section-title">The good stuff</h3><div class="amenity-pills">${stay.amenities.map((item) => `<span class="amenity-pill">${icon(amenityIcon(item))} ${escapeHtml(item)}</span>`).join("")}</div><h3 class="detail-section-title">About this place</h3><p class="detail-description">${escapeHtml(stay.description || "A well-kept home with thoughtful shared spaces, friendly management and everything you need to settle into the neighbourhood." )}</p><div class="detail-bottom"><span class="contact-hint"><strong>${escapeHtml(stay.ownerName || "A friendly local host")}</strong><span>Usually replies within a few hours</span></span><button class="button-primary" data-enquire="${escapeHtml(stay.id)}">${icon("message-circle")} Request a visit</button></div></div><button class="modal-close detail-close" aria-label="Close details" title="Close">${icon("x")}</button></div>`);
  const close = byId("modal-layer").querySelector(".detail-close");
  close.style.position = "fixed";
  close.style.top = "max(25px, calc((100vh - min(90vh, 900px)) / 2 + 10px))";
  close.style.right = "max(25px, calc((100vw - min(720px, 100vw)) / 2 + 10px))";
}

function amenityIcon(item) {
  return ({ "Wi-Fi": "wifi", Food: "utensils", Laundry: "shirt", AC: "wind", Parking: "car-front" })[item] || "check";
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That file is not a valid image."));
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.76));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function openListingForm() {
  if (!state.user || state.user.role !== "OWNER") {
    openLogin("OWNER");
    return;
  }
  showModal(`<div class="modal"><div class="modal-head"><div><h2>Put your place on the map</h2><p>Share the details people need to picture their next home.</p></div><button class="modal-close" aria-label="Close" title="Close">${icon("x")}</button></div><form class="form-body" id="listing-form"><div class="form-grid"><label class="form-field full">PG name<input name="name" required maxlength="65" placeholder="e.g. The Mango Tree House" /></label><label class="form-field">Area<input name="area" required placeholder="Koramangala" /></label><label class="form-field">Full address<input name="address" required placeholder="Street, neighbourhood, Bengaluru" /></label><label class="form-field">Monthly rent per person (₹)<input name="rent" type="number" min="1000" max="200000" required placeholder="12000" /></label><label class="form-field">Refundable deposit (₹)<input name="deposit" type="number" min="0" max="500000" required placeholder="24000" /></label><label class="form-field">Room sharing<select name="sharing" required><option value="1">Single sharing</option><option value="2" selected>Double sharing</option><option value="3">Triple sharing</option><option value="4">Four sharing</option></select></label><label class="form-field">Available beds<input name="vacancies" type="number" min="1" max="100" required placeholder="2" /></label><label class="form-field">Guest preference<select name="gender"><option value="any">All genders</option><option value="women">Women only</option><option value="men">Men only</option></select></label><label class="form-field">Contact phone<input name="phone" type="tel" required placeholder="10-digit mobile number" /></label><label class="form-field full">Amenities <span class="upload-note">Choose all that apply</span><span class="amenity-pills">${["Wi-Fi", "Food", "Laundry", "AC", "Parking"].map((item) => `<label class="amenity-pill"><input type="checkbox" name="amenities" value="${item}" /> ${item}</label>`).join("")}</span></label><label class="form-field full">Photos <span class="upload-note">Add up to 5 JPG or PNG images, 8 MB each.</span><span class="upload-box">${icon("image-plus")} Choose property photos<input name="photos" type="file" accept="image/png,image/jpeg,image/webp" multiple /></span><span class="form-preview" id="form-preview"></span></label><label class="form-field full">A little about your place<textarea name="description" maxlength="300" placeholder="What makes your PG a lovely place to live?"></textarea></label></div><p class="form-error hidden" id="listing-error"></p><div class="form-actions"><button type="button" class="button-secondary modal-cancel">Cancel</button><button type="submit" class="button-primary">Publish listing ${icon("arrow-right")}</button></div></form></div>`);
}

function openCompare() {
  const stays = state.stays.filter((stay) => state.compare.includes(stay.id));
  const rows = [
    ["Monthly rent", (stay) => `<span class="price-cell">${money(stay.rent)}</span>`],
    ["Deposit", (stay) => money(stay.deposit)],
    ["Room type", (stay) => `${stay.sharing} sharing`],
    ["Guest preference", (stay) => stay.gender === "any" ? "All genders" : stay.gender === "women" ? "Women only" : "Men only"],
    ["Vacancies", (stay) => `${stay.vacancies} beds`],
    ["Amenities", (stay) => stay.amenities.join(", ")]
  ];
  showModal(`<div class="modal"><div class="modal-head"><div><h2>Side by side</h2><p>Good choices get easier when you can see them together.</p></div><button class="modal-close" aria-label="Close" title="Close">${icon("x")}</button></div><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th></th>${stays.map((stay) => `<th><img src="${escapeHtml(stay.image)}" alt="" />${escapeHtml(stay.name)}<br /><span class="stay-area">${escapeHtml(stay.area)}</span></th>`).join("")}</tr></thead><tbody>${rows.map(([label, value]) => `<tr><td>${label}</td>${stays.map((stay) => `<td>${value(stay)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`);
}

function resetFilters() {
  state.location = "";
  state.sharing = "any";
  state.gender = "any";
  state.budget = 25000;
  state.amenities = [];
  byId("location-search").value = "";
  byId("search-sharing").value = "any";
  byId("budget-filter").value = 25000;
  byId("budget-label").textContent = "Up to ₹25,000";
  document.querySelectorAll("#gender-filter .choice").forEach((button) => button.classList.toggle("active", button.dataset.gender === "any"));
  document.querySelectorAll(".amenity-options input").forEach((checkbox) => checkbox.checked = false);
  renderExplore();
}

async function toggleFavorite(id) {
  if (state.user?.role !== "STUDENT") {
    openLogin("STUDENT", "register");
    return;
  }
  const removing = state.favorites.includes(id);
  try {
    await api(`/api/favourites/${encodeURIComponent(id)}`, { method: removing ? "DELETE" : "POST" });
    state.favorites = removing ? state.favorites.filter((item) => item !== id) : [...state.favorites, id];
    renderExplore();
    if (state.view === "saved") renderSaved();
    showToast(removing ? "Removed from your favourites" : "Saved to your favourites");
  } catch (error) {
    showToast(error.message);
  }
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) { setView(viewButton.dataset.view); return; }
    const detailButton = event.target.closest("[data-detail]");
    if (detailButton) { openDetails(detailButton.dataset.detail); return; }
    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) {
      void toggleFavorite(favoriteButton.dataset.favorite);
      return;
    }
    if (event.target.closest("#list-property, #dashboard-add, #empty-add")) { openListingForm(); return; }
    if (event.target.closest("#profile-button")) { openAccountMenu(); return; }
    if (event.target.closest("#sign-out")) {
      void api("/api/auth/logout", { method: "POST" }).then(() => window.location.reload()).catch((error) => showToast(error.message));
      return;
    }
    if (event.target.closest("#modal-layer .modal-close, #modal-layer .modal-cancel")) { closeModal(); return; }
    if (event.target === byId("modal-layer")) { closeModal(); return; }
    if (event.target.closest("#compare-open")) { openCompare(); return; }
    if (event.target.closest("#compare-clear")) { state.compare = []; renderExplore(); return; }
    if (event.target.closest("#clear-filters, #empty-clear")) { resetFilters(); return; }
    if (event.target.closest("#mobile-filter")) { byId("filters-panel").classList.toggle("mobile-open"); return; }
    if (event.target.closest("#map-toggle")) {
      const panel = byId("map-panel");
      const showingMap = panel.classList.contains("hidden");
      panel.classList.toggle("hidden", !showingMap);
      byId("listing-list").classList.toggle("hidden", showingMap || getFilteredStays().length === 0);
      byId("map-toggle").innerHTML = `${icon(showingMap ? "list" : "map")}<span>${showingMap ? "Show list" : "Show map"}</span>`;
      refreshIcons();
      return;
    }
    const enquireButton = event.target.closest("[data-enquire]");
    if (enquireButton) {
      if (state.user?.role !== "STUDENT") { openLogin("STUDENT", "register"); return; }
      void api(`/api/enquiries/${encodeURIComponent(enquireButton.dataset.enquire)}`, { method: "POST", body: { message: "Visit request" } })
        .then(() => { closeModal(); showToast("Visit request sent. The host will be in touch."); })
        .catch((error) => showToast(error.message));
      return;
    }
    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
      const stay = state.owned.find((item) => item.id === deleteButton.dataset.delete);
      if (stay && window.confirm(`Remove "${stay.name}" from your listings?`)) {
        void api(`/api/owner/listings/${encodeURIComponent(stay.id)}`, { method: "DELETE" }).then(async () => {
          state.owned = await api("/api/owner/listings");
          state.stays = await api("/api/listings");
          state.compare = state.compare.filter((id) => id !== stay.id);
          renderOwnerDashboard();
          renderExplore();
          showToast("Listing removed");
        }).catch((error) => showToast(error.message));
      }
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-compare]")) {
      const id = event.target.dataset.compare;
      if (event.target.checked && state.compare.length >= 3) { event.target.checked = false; showToast("Compare up to 3 stays at a time"); return; }
      state.compare = event.target.checked ? [...state.compare, id] : state.compare.filter((item) => item !== id);
      renderCompareDock();
      document.querySelectorAll(`[data-compare="${CSS.escape(id)}"]`).forEach((checkbox) => checkbox.checked = state.compare.includes(id));
    }
    if (event.target.matches("[data-availability]")) {
      const stay = state.owned.find((item) => item.id === event.target.dataset.availability);
      if (stay) void api(`/api/owner/listings/${encodeURIComponent(stay.id)}/availability`, {
        method: "PATCH", body: { available: event.target.checked }
      }).then((updated) => {
        state.owned = state.owned.map((item) => item.id === updated.id ? updated : item);
        state.stays = state.stays.map((item) => item.id === updated.id ? updated : item);
        renderOwnerDashboard();
        renderExplore();
        showToast(event.target.checked ? "Listing is visible to seekers" : "Listing paused");
      }).catch((error) => { event.target.checked = stay.available; showToast(error.message); });
    }
    if (event.target.matches("#budget-filter")) {
      state.budget = Number(event.target.value);
      byId("budget-label").textContent = state.budget >= 50000 ? "Any budget" : `Up to ${money(state.budget)}`;
      renderExplore();
    }
    if (event.target.matches("#search-sharing")) { state.sharing = event.target.value; renderExplore(); }
    if (event.target.matches("#sort-select")) renderExplore();
    if (event.target.matches(".amenity-options input")) {
      state.amenities = [...document.querySelectorAll(".amenity-options input:checked")].map((input) => input.value);
      renderExplore();
    }
    if (event.target.matches("input[name='photos']")) {
      const files = [...event.target.files].slice(0, 5);
      const preview = byId("form-preview");
      preview.innerHTML = files.map((file) => `<span>${escapeHtml(file.name)}</span>`).join("");
      preview.classList.toggle("hidden", files.length === 0);
      preview.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;margin-top:7px";
      [...preview.children].forEach((child) => { child.style.cssText = "padding:5px 7px;background:#f1f5ef;border-radius:3px;color:#617168;font-size:8px"; });
    }
    if (event.target.matches(".login-switch button")) {
      document.querySelectorAll(".login-switch button").forEach((button) => button.classList.toggle("active", button === event.target));
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("#location-search")) {
      state.location = event.target.value;
      renderExplore();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.matches("#gender-filter .choice")) return;
    state.gender = event.target.dataset.gender;
    document.querySelectorAll("#gender-filter .choice").forEach((button) => button.classList.toggle("active", button === event.target));
    renderExplore();
  });

  byId("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.location = byId("location-search").value;
    state.sharing = byId("search-sharing").value;
    setView("explore");
  });

  byId("modal-layer").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    if (form.id === "listing-form") {
      const data = new FormData(form);
      const error = byId("listing-error");
      error.classList.add("hidden");
      try {
        const files = [...form.elements.photos.files].slice(0, 5);
        const photos = await Promise.all(files.map(compressImage));
        const listing = await api("/api/owner/listings", { method: "POST", body: {
          name: String(data.get("name")).trim(),
          area: String(data.get("area")).trim(),
          address: String(data.get("address")).trim(),
          latitude: data.get("latitude") ? Number(data.get("latitude")) : null,
          longitude: data.get("longitude") ? Number(data.get("longitude")) : null,
          rent: Number(data.get("rent")),
          deposit: Number(data.get("deposit")),
          sharing: Number(data.get("sharing")),
          genderPreference: String(data.get("gender")),
          vacancies: Number(data.get("vacancies")),
          contactPhone: String(data.get("phone")).trim(),
          amenities: data.getAll("amenities"),
          photos,
          description: String(data.get("description")).trim()
        } });
        state.owned = await api("/api/owner/listings");
        state.stays = await api("/api/listings");
        closeModal();
        setView("listings");
        showToast(`${listing.name} is live on Find My PG`);
      } catch (submissionError) {
        error.textContent = submissionError.message || "Could not publish your listing.";
        error.classList.remove("hidden");
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !byId("modal-layer").classList.contains("hidden")) closeModal();
  });
}

loadState();
bindEvents();
renderExplore();
updateCounts();
if (state.user) byId("profile-button").textContent = state.user.fullName.trim().charAt(0).toUpperCase();
refreshIcons();
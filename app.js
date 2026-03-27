// ============================================================
// app.js — Locapedia shared application logic
//
// Responsibilities:
//   - Initialise the Supabase client
//   - Admin session management (password-based, sessionStorage)
//   - Render form fields (editable and read-only)
//   - Run simple and advanced searches
//   - Render search result rows
//   - Shared utilities (flash banners, truncation, etc.)
//
// Depends on: config.js (loaded before this file in every page)
//             Supabase JS CDN client
//             marked.js (Markdown → HTML)
// ============================================================


// -- Supabase client -----------------------------------------

const supabase = window.supabase.createClient(
  CONFIG.supabase_url,
  CONFIG.supabase_key
);


// -- Admin session -------------------------------------------
// We store a flag in sessionStorage so the password isn't
// re-entered on every page navigation within the same tab.

const AUTH = {

  isLoggedIn() {
    return sessionStorage.getItem("locapedia_admin") === "true";
  },

  login(password) {
    if (password === CONFIG.admin_password) {
      sessionStorage.setItem("locapedia_admin", "true");
      return true;
    }
    return false;
  },

  logout() {
    sessionStorage.removeItem("locapedia_admin");
  },

  // Call at the top of any admin-only page to redirect if not authed.
  requireAdmin() {
    if (!AUTH.isLoggedIn()) {
      window.location.href = "admin.html";
    }
  },
};


// -- Field rendering -----------------------------------------

const RENDER = {

  // Render all fields as editable inputs inside `containerEl`.
  // mode: "submit" | "review" | "edit"
  // values: object keyed by field.key (used in review/edit modes)
  editableForm(containerEl, mode, values = {}) {

    let currentSection = null;

    FIELDS.forEach(field => {

      // Insert section heading when section changes
      if (field.section !== currentSection) {
        currentSection = field.section;
        const heading = document.createElement("div");
        heading.className = "form-section-title";
        heading.textContent = currentSection === "canvas"
          ? "Business Model Canvas"
          : "General Information";
        containerEl.appendChild(heading);
      }

      const group = document.createElement("div");
      group.className = "field-group";

      // Label
      const label = document.createElement("label");
      label.htmlFor = `field_${field.key}`;
      label.innerHTML = field.label
        + (field.mandatory && mode === "submit"
            ? ' <span class="required">*</span>'
            : "");
      group.appendChild(label);

      // Input or textarea
      const el = field.type === "multiline"
        ? document.createElement("textarea")
        : document.createElement("input");

      if (field.type === "single_line") el.type = "text";
      el.id   = `field_${field.key}`;
      el.name = field.key;

      if (mode === "submit") {
        // Show helper text as placeholder
        el.placeholder = field.helper_text;
      } else {
        // Populate with existing value
        el.value = values[field.key] || "";
        if (field.type === "multiline") el.textContent = values[field.key] || "";
      }

      group.appendChild(el);
      containerEl.appendChild(group);
    });
  },

  // Render all fields as read-only display (Show page).
  // values: object keyed by field.key
  readOnly(containerEl, values) {

    let currentSection = null;

    FIELDS.forEach(field => {

      if (field.section !== currentSection) {
        currentSection = field.section;
        const heading = document.createElement("div");
        heading.className = "form-section-title";
        heading.textContent = currentSection === "canvas"
          ? "Business Model Canvas"
          : "General Information";
        containerEl.appendChild(heading);
      }

      const display = document.createElement("div");
      display.className = "field-display";

      const labelEl = document.createElement("div");
      labelEl.className = "field-label";
      labelEl.textContent = field.label;
      display.appendChild(labelEl);

      const valueEl = document.createElement("div");
      valueEl.className = "field-value";
      const raw = values[field.key];

      if (!raw) {
        valueEl.classList.add("empty");
        valueEl.textContent = "—";
      } else if (field.type === "multiline") {
        // Render Markdown to HTML (marked.js)
        valueEl.innerHTML = marked.parse(raw);
      } else {
        valueEl.textContent = raw;
      }

      display.appendChild(valueEl);
      containerEl.appendChild(display);
    });
  },

  // Render a single result row for search listings.
  // Returns an <li> element.
  resultRow(obj, onShow) {
    const li = document.createElement("li");

    const fields = document.createElement("div");
    fields.className = "result-fields";

    const name = document.createElement("div");
    name.className = "result-name";
    name.textContent = obj.name || "(unnamed)";
    fields.appendChild(name);

    // Show sector + truncated description as secondary line
    const metaParts = [];
    if (obj.sector)      metaParts.push(obj.sector);
    if (obj.description) metaParts.push(UTIL.truncate(obj.description, 120));
    if (metaParts.length) {
      const meta = document.createElement("div");
      meta.className = "result-meta";
      meta.textContent = metaParts.join(" · ");
      fields.appendChild(meta);
    }

    const showBtn = document.createElement("button");
    showBtn.className = "result-show";
    showBtn.textContent = "Show →";
    showBtn.addEventListener("click", () => onShow(obj));

    li.appendChild(fields);
    li.appendChild(showBtn);
    return li;
  },
};


// -- Search --------------------------------------------------

const SEARCH = {

  // Simple search: match query against name, description, sector.
  // Returns approved records from Supabase matching any of the three fields.
  // Supabase doesn't support OR across columns natively in the anon client,
  // so we fetch all and filter client-side (fine for < 100 records).
  async simple(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const { data, error } = await supabase
      .from(CONFIG.table_approved)
      .select("*")
      .order("name");

    if (error) throw error;

    return data.filter(obj =>
      SIMPLE_SEARCH_FIELDS.some(field =>
        (obj[field.key] || "").toLowerCase().includes(q)
      )
    );
  },

  // Advanced search: match each non-empty field value.
  // All provided values must match (AND logic).
  async advanced(values) {
    const { data, error } = await supabase
      .from(CONFIG.table_approved)
      .select("*")
      .order("name");

    if (error) throw error;

    return data.filter(obj =>
      Object.entries(values).every(([key, val]) => {
        if (!val.trim()) return true;  // empty field = no filter
        return (obj[key] || "").toLowerCase().includes(val.trim().toLowerCase());
      })
    );
  },

  // Render result rows into a <ul> container.
  // onShow: function called with the object when Show is clicked.
  renderResults(listEl, countEl, objects, onShow) {
    listEl.innerHTML = "";
    countEl.textContent = objects.length
      ? `${objects.length} result${objects.length !== 1 ? "s" : ""}`
      : "";

    if (!objects.length) {
      const li = document.createElement("li");
      li.className = "no-results";
      li.textContent = "No matching business models found.";
      listEl.appendChild(li);
      return;
    }

    objects.forEach(obj => {
      listEl.appendChild(RENDER.resultRow(obj, onShow));
    });
  },
};


// -- Navigation helpers --------------------------------------

const NAV = {

  // Store an object in sessionStorage and open the Show page.
  // returnPage: the page URL to return to when "Close" is clicked.
  openShow(obj, returnPage) {
    sessionStorage.setItem("locapedia_show_obj",    JSON.stringify(obj));
    sessionStorage.setItem("locapedia_show_return", returnPage || "index.html");
    window.location.href = "show.html";
  },

  // Store a submission object and open the admin Review form.
  openReview(submission) {
    sessionStorage.setItem("locapedia_review_obj", JSON.stringify(submission));
    window.location.href = "review.html";
  },

  // Store an approved object and open the Edit form.
  openEdit(obj) {
    sessionStorage.setItem("locapedia_edit_obj", JSON.stringify(obj));
    window.location.href = "edit.html";
  },
};


// -- Flash banners -------------------------------------------

const FLASH = {

  // Show a temporary banner at the top of .page.
  // type: "success" | "warning" | "error"
  show(message, type = "success", durationMs = 4000) {
    const existing = document.querySelector(".flash-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.className = `banner banner-${type} flash-banner`;
    banner.textContent = message;

    const page = document.querySelector(".page");
    page.insertBefore(banner, page.firstChild);

    if (durationMs) {
      setTimeout(() => banner.remove(), durationMs);
    }
    return banner;
  },

  // Check sessionStorage for a queued flash (set before a redirect).
  checkQueued() {
    const msg  = sessionStorage.getItem("locapedia_flash_msg");
    const type = sessionStorage.getItem("locapedia_flash_type");
    if (msg) {
      FLASH.show(msg, type || "success");
      sessionStorage.removeItem("locapedia_flash_msg");
      sessionStorage.removeItem("locapedia_flash_type");
    }
  },

  // Queue a flash message to appear after the next page load.
  queue(message, type = "success") {
    sessionStorage.setItem("locapedia_flash_msg",  message);
    sessionStorage.setItem("locapedia_flash_type", type);
  },
};


// -- Utilities -----------------------------------------------

const UTIL = {

  truncate(str, maxLen) {
    if (!str) return "";
    return str.length <= maxLen ? str : str.slice(0, maxLen).trimEnd() + "…";
  },

  // Collect all field values from the form inside `containerEl`.
  // Returns an object keyed by field.key.
  collectFormValues(containerEl) {
    const values = {};
    FIELDS.forEach(field => {
      const el = containerEl.querySelector(`#field_${field.key}`);
      if (el) values[field.key] = el.value.trim();
    });
    return values;
  },

  // Validate mandatory fields. Returns array of missing field labels.
  validateMandatory(values) {
    return MANDATORY_FIELDS
      .filter(f => !values[f.key])
      .map(f => f.label);
  },
};


// -- Active nav link highlight --------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach(a => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });
});

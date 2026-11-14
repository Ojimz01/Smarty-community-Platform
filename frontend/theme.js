/* Smart Community theme switcher.
   Runs in <head> so the saved theme is applied before the first paint.
   The toggle is injected into the existing header (or auth panel) once the
   document is ready, so pages never carry duplicate navigation markup. */
(function () {
  "use strict";

  const STORAGE_KEY = "smartCommunityTheme";
  const root = document.documentElement;
  const media = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  let transitionTimer = null;

  function readStoredTheme() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function systemTheme() {
    return media && media.matches ? "dark" : "light";
  }

  let theme = readStoredTheme() || systemTheme();

  function updateThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#111214" : "#fdfcfc");
  }

  function syncToggle(button) {
    if (!button) return;
    const isDark = theme === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    button.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
  }

  function syncAllToggles() {
    document.querySelectorAll("[data-theme-toggle]").forEach(syncToggle);
  }

  function applyTheme(nextTheme, options) {
    const settings = options || {};
    theme = nextTheme === "dark" ? "dark" : "light";

    if (settings.animate) {
      root.classList.add("theme-transition");
      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(() => {
        root.classList.remove("theme-transition");
      }, 320);
    }

    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    updateThemeColor();
    syncAllToggles();

    if (settings.persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch (error) {
        /* Preference persistence can fail in private mode; the theme still applies. */
      }
    }
  }

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark", { persist: true, animate: true });
  }

  // Apply immediately, before body content renders, to avoid a flash.
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;

  function createToggle(extraClass) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle" + (extraClass ? " " + extraClass : "");
    button.setAttribute("data-theme-toggle", "");
    button.innerHTML = [
      '<span class="theme-toggle-icon" aria-hidden="true">',
      '<svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" focusable="false">',
      '<circle cx="12" cy="12" r="4.1"></circle>',
      '<path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.35 5.35l1.55 1.55M17.1 17.1l1.55 1.55M18.65 5.35L17.1 6.9M6.9 17.1l-1.55 1.55"></path>',
      "</svg>",
      '<svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false">',
      '<path d="M20.5 14.4A8.6 8.6 0 0 1 9.6 3.5a8.6 8.6 0 1 0 10.9 10.9z"></path>',
      "</svg>",
      "</span>"
    ].join("");
    button.addEventListener("click", toggleTheme);
    syncToggle(button);
    return button;
  }

  function mountToggle() {
    if (document.querySelector("[data-theme-toggle]")) {
      syncAllToggles();
      updateThemeColor();
      return;
    }

    const authBrand = document.querySelector(".auth-brand");
    const headerInner = document.querySelector(".site-header .header-inner");
    const dashboardActions = document.querySelector(".dashboard-header-actions");
    const detailActions = document.querySelector(".detail-nav-actions");

    if (authBrand) {
      authBrand.appendChild(createToggle("theme-toggle-inverse"));
    } else if (headerInner) {
      const mobileToggle = headerInner.querySelector(".mobile-menu-toggle");
      const toggle = createToggle("");
      if (mobileToggle) headerInner.insertBefore(toggle, mobileToggle);
      else headerInner.appendChild(toggle);
    } else if (dashboardActions) {
      dashboardActions.appendChild(createToggle(""));
    } else if (detailActions) {
      detailActions.appendChild(createToggle(""));
    } else {
      document.body.appendChild(createToggle("theme-toggle-floating"));
    }

    updateThemeColor();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountToggle, { once: true });
  } else {
    mountToggle();
  }

  if (media) {
    const handleSystemChange = (event) => {
      if (!readStoredTheme()) applyTheme(event.matches ? "dark" : "light", { animate: true });
    };
    if (typeof media.addEventListener === "function") media.addEventListener("change", handleSystemChange);
    else if (typeof media.addListener === "function") media.addListener(handleSystemChange);
  }

  window.SmartCommunityTheme = {
    apply: applyTheme,
    current: () => theme
  };
})();

/* =========================================================================
   Aisle & Beyond — Wedding Concierge
   Behaviour: accessible mobile navigation, sticky header state,
              scroll-reveal animations
   ========================================================================= */

(function () {
  "use strict";

  var TABLET_BREAKPOINT = 1024;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------------
     Mobile / tablet navigation
     -------------------------------------------------------------------- */

  var toggle = document.getElementById("nav-toggle");
  var panel = document.getElementById("nav-panel");

  function setMenu(isOpen) {
    if (!toggle || !panel) return;

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    panel.classList.toggle("is-open", isOpen);
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    });

    // Close after choosing a destination.
    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setMenu(false);
      }
    });

    // Close on Escape and return focus to the trigger.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });

    // Reset state when growing back to the desktop layout.
    window.addEventListener("resize", function () {
      if (window.innerWidth > TABLET_BREAKPOINT) {
        setMenu(false);
      }
    });
  }

  /* -----------------------------------------------------------------------
     Sticky header state
     -------------------------------------------------------------------- */

  var header = document.getElementById("header");

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("header--scrolled", window.scrollY > 24);
  }

  if (header) {
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  /* -----------------------------------------------------------------------
     Inquiry form (contact page)

     No backend: we validate in the browser, then swap the form for a
     thank-you message. Nothing is transmitted anywhere.
     -------------------------------------------------------------------- */

  var form = document.getElementById("inquiry-form");
  var formSuccess = document.getElementById("form-success");

  function showError(field, message) {
    var error = document.getElementById(field.id + "-error");

    field.setAttribute("aria-invalid", "true");

    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  function clearError(field) {
    var error = document.getElementById(field.id + "-error");

    field.removeAttribute("aria-invalid");

    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  }

  function validateField(field) {
    var value = field.value.trim();

    if (!value) {
      showError(field, field.id === "email" ? "Please enter your email." : "Please enter your name.");
      return false;
    }

    // Deliberately permissive: catches typos, rejects nothing legitimate.
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showError(field, "Please enter a valid email address.");
      return false;
    }

    clearError(field);
    return true;
  }

  if (form) {
    var requiredFields = Array.prototype.slice.call(form.querySelectorAll("[required]"));

    requiredFields.forEach(function (field) {
      // Only re-validate once a field has been flagged, so typing isn't nagged.
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") {
          validateField(field);
        }
      });
      field.addEventListener("blur", function () {
        if (field.value.trim()) {
          validateField(field);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;

      requiredFields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) {
          firstInvalid = field;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      form.hidden = true;

      if (formSuccess) {
        formSuccess.hidden = false;
        formSuccess.setAttribute("tabindex", "-1");
        formSuccess.focus();
      }
    });
  }

  /* -----------------------------------------------------------------------
     Scroll reveal
     -------------------------------------------------------------------- */

  var revealItems = document.querySelectorAll("[data-reveal]");

  function revealAll() {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  if (!revealItems.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  revealItems.forEach(function (item) {
    observer.observe(item);
  });
})();

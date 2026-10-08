/* =========================================================================
   Aisle & Beyond — Wedding Concierge
   Behaviour: sidebar navigation, hero slider, scroll-reveal animations
   ========================================================================= */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------------
     Sidebar navigation (opens on click, all viewports)
     -------------------------------------------------------------------- */

  var toggle = document.getElementById("nav-toggle");
  var sidebar = document.getElementById("sidebar");
  var backdrop = document.getElementById("sidebar-backdrop");

  function setMenu(isOpen) {
    if (!toggle || !sidebar) return;

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
    sidebar.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);

    if (backdrop) {
      backdrop.hidden = !isOpen;
      backdrop.classList.toggle("is-visible", isOpen);
    }
  }

  if (toggle && sidebar) {
    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    });

    sidebar.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setMenu(false);
      }
    });

    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setMenu(false);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* -----------------------------------------------------------------------
     Home hero slider
     -------------------------------------------------------------------- */

  var heroSlider = document.querySelector("[data-hero-slider]");

  if (heroSlider) {
    var slides = heroSlider.querySelectorAll(".hero__slide");
    var dots = heroSlider.querySelectorAll(".hero__dot");
    var activeIndex = 0;
    var timerId = null;
    var SLIDE_INTERVAL = 7000;

    function showSlide(index) {
      if (!slides.length) return;

      activeIndex = (index + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === activeIndex);
      });

      dots.forEach(function (dot, i) {
        var isActive = i === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", String(isActive));
      });
    }

    function startAutoplay() {
      if (prefersReducedMotion || slides.length < 2) return;
      stopAutoplay();
      timerId = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, SLIDE_INTERVAL);
    }

    function stopAutoplay() {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var index = Number(dot.getAttribute("data-slide"));
        if (!Number.isNaN(index)) {
          showSlide(index);
          startAutoplay();
        }
      });
    });

    heroSlider.addEventListener("mouseenter", stopAutoplay);
    heroSlider.addEventListener("mouseleave", startAutoplay);

    showSlide(0);
    startAutoplay();
  }

  /* -----------------------------------------------------------------------
     Brides gallery lightbox
     -------------------------------------------------------------------- */

  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lightbox-image");
  var lightboxClose = document.getElementById("lightbox-close");
  var lightboxPrev = document.getElementById("lightbox-prev");
  var lightboxNext = document.getElementById("lightbox-next");
  var lightboxTriggers = document.querySelectorAll(".brides-masonry__trigger");
  var lightboxItems = [];
  var lightboxIndex = 0;
  var lightboxLastFocus = null;

  lightboxTriggers.forEach(function (trigger) {
    lightboxItems.push({
      src: trigger.getAttribute("data-lightbox-src"),
      alt: trigger.querySelector("img") ? trigger.querySelector("img").getAttribute("alt") || "" : "",
    });
  });

  function renderLightbox(index) {
    if (!lightboxImage || !lightboxItems.length) return;

    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    var item = lightboxItems[lightboxIndex];

    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
  }

  function openLightbox(index, trigger) {
    if (!lightbox) return;

    lightboxLastFocus = trigger || document.activeElement;
    renderLightbox(index);
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");

    if (lightboxClose) {
      lightboxClose.focus();
    }
  }

  function closeLightbox() {
    if (!lightbox) return;

    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");

    if (lightboxImage) {
      lightboxImage.removeAttribute("src");
    }

    if (lightboxLastFocus && typeof lightboxLastFocus.focus === "function") {
      lightboxLastFocus.focus();
    }
  }

  if (lightbox && lightboxItems.length) {
    lightboxTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var index = Number(trigger.getAttribute("data-lightbox-index"));
        openLightbox(Number.isNaN(index) ? 0 : index, trigger);
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
    }

    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", function () {
        renderLightbox(lightboxIndex - 1);
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener("click", function () {
        renderLightbox(lightboxIndex + 1);
      });
    }

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        renderLightbox(lightboxIndex - 1);
      }

      if (event.key === "ArrowRight") {
        renderLightbox(lightboxIndex + 1);
      }
    });
  }

  /* -----------------------------------------------------------------------
     Inquiry form (contact page)
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
     Method steps carousel (About page)
     -------------------------------------------------------------------- */

  var methodCarousels = document.querySelectorAll("[data-method-carousel]");
  var METHOD_CAROUSEL_INTERVAL = 6000;

  methodCarousels.forEach(function (carousel) {
    var track = carousel.querySelector(".method-carousel__track");
    var prevButton = carousel.querySelector("[data-method-carousel-prev]");
    var nextButton = carousel.querySelector("[data-method-carousel-next]");
    var carouselTimerId = null;

    if (!track || !prevButton || !nextButton) return;

    function getStepDistance() {
      var slide = track.querySelector(".method-carousel__slide");
      if (!slide) return 0;

      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;

      return slide.offsetWidth + gap;
    }

    function getMaxScroll() {
      return track.scrollWidth - track.clientWidth;
    }

    function scrollBehavior() {
      return prefersReducedMotion ? "auto" : "smooth";
    }

    function updateControls() {
      var maxScroll = getMaxScroll();
      prevButton.disabled = track.scrollLeft <= 4;
      nextButton.disabled = maxScroll <= 0 || track.scrollLeft >= maxScroll - 4;
    }

    function scrollNext() {
      var maxScroll = getMaxScroll();

      if (maxScroll <= 0) return;

      if (track.scrollLeft >= maxScroll - 4) {
        track.scrollTo({ left: 0, behavior: scrollBehavior() });
        return;
      }

      track.scrollBy({
        left: getStepDistance(),
        behavior: scrollBehavior(),
      });
    }

    function scrollPrev() {
      if (track.scrollLeft <= 4) return;

      track.scrollBy({
        left: -getStepDistance(),
        behavior: scrollBehavior(),
      });
    }

    function startAutoplay() {
      if (prefersReducedMotion || getMaxScroll() <= 0) return;
      stopAutoplay();
      carouselTimerId = window.setInterval(scrollNext, METHOD_CAROUSEL_INTERVAL);
    }

    function stopAutoplay() {
      if (carouselTimerId !== null) {
        window.clearInterval(carouselTimerId);
        carouselTimerId = null;
      }
    }

    prevButton.addEventListener("click", function () {
      scrollPrev();
      startAutoplay();
    });

    nextButton.addEventListener("click", function () {
      scrollNext();
      startAutoplay();
    });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", function (event) {
      if (!carousel.contains(event.relatedTarget)) {
        startAutoplay();
      }
    });

    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", function () {
      updateControls();
      startAutoplay();
    });

    updateControls();
    startAutoplay();
  });

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

/* =========================================================================
   Aisle & Beyond — Wedding Concierge
   Behaviour: sidebar navigation, hero slider, scroll-reveal animations
   ========================================================================= */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------------
     Sidebar navigation (drawer on mobile, always visible on desktop)
     -------------------------------------------------------------------- */

  var toggle = document.getElementById("nav-toggle");
  var sidebar = document.getElementById("sidebar");
  var backdrop = document.getElementById("sidebar-backdrop");
  var mobileNavQuery = window.matchMedia("(max-width: 768px)");

  function isMobileNav() {
    return mobileNavQuery.matches;
  }

  function setMenu(isOpen) {
    if (!toggle || !sidebar) return;

    if (!isMobileNav()) {
      isOpen = false;
    }

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
    mobileNavQuery.addEventListener("change", function () {
      setMenu(false);
    });
    setMenu(false);

    toggle.addEventListener("click", function () {
      if (!isMobileNav()) return;
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
    var SLIDE_INTERVAL = 3000;

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
     Testimonial slider & modal (Home)
     -------------------------------------------------------------------- */

  var testimonialSlider = document.querySelector("[data-testimonial-slider]");
  var testimonialModal = document.getElementById("testimonial-modal");
  var testimonialModalTitle = document.getElementById("testimonial-modal-title");
  var testimonialModalBody = document.getElementById("testimonial-modal-body");
  var testimonialModalAuthor = document.getElementById("testimonial-modal-author");
  var testimonialModalImage = document.getElementById("testimonial-modal-image");
  var testimonialLastFocus = null;
  var TESTIMONIAL_INTERVAL = 7000;
  var pauseTestimonialAutoplay = function () {};
  var resumeTestimonialAutoplay = function () {};

  if (testimonialSlider) {
    var testimonialSlides = testimonialSlider.querySelectorAll("[data-testimonial-slide]");
    var testimonialPrev = testimonialSlider.querySelector("[data-testimonial-prev]");
    var testimonialNext = testimonialSlider.querySelector("[data-testimonial-next]");
    var testimonialActiveIndex = 0;
    var testimonialTimerId = null;

    function showTestimonial(index) {
      if (!testimonialSlides.length) return;

      testimonialActiveIndex = (index + testimonialSlides.length) % testimonialSlides.length;

      testimonialSlides.forEach(function (slide, i) {
        var isActive = i === testimonialActiveIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });
    }

    function startTestimonialAutoplay() {
      if (
        prefersReducedMotion ||
        testimonialSlides.length < 2 ||
        (testimonialModal && !testimonialModal.hidden)
      ) {
        return;
      }
      stopTestimonialAutoplay();
      testimonialTimerId = window.setInterval(function () {
        showTestimonial(testimonialActiveIndex + 1);
      }, TESTIMONIAL_INTERVAL);
    }

    function stopTestimonialAutoplay() {
      if (testimonialTimerId !== null) {
        window.clearInterval(testimonialTimerId);
        testimonialTimerId = null;
      }
    }

    if (testimonialPrev) {
      testimonialPrev.addEventListener("click", function () {
        showTestimonial(testimonialActiveIndex - 1);
        startTestimonialAutoplay();
      });
    }

    if (testimonialNext) {
      testimonialNext.addEventListener("click", function () {
        showTestimonial(testimonialActiveIndex + 1);
        startTestimonialAutoplay();
      });
    }

    testimonialSlider.addEventListener("mouseenter", stopTestimonialAutoplay);
    testimonialSlider.addEventListener("mouseleave", startTestimonialAutoplay);
    testimonialSlider.addEventListener("focusin", stopTestimonialAutoplay);
    testimonialSlider.addEventListener("focusout", function (event) {
      if (!testimonialSlider.contains(event.relatedTarget)) {
        startTestimonialAutoplay();
      }
    });

    pauseTestimonialAutoplay = stopTestimonialAutoplay;
    resumeTestimonialAutoplay = startTestimonialAutoplay;

    showTestimonial(0);
    startTestimonialAutoplay();
  }

  function openTestimonialModal(slide, trigger) {
    if (!testimonialModal || !slide) return;

    var fullCopy = slide.querySelector(".testimonial-slide__full");
    var title = slide.getAttribute("data-modal-title") || "";
    var author = slide.getAttribute("data-modal-author") || "";
    var imageSrc = slide.getAttribute("data-modal-image") || "";
    var imageAlt = slide.getAttribute("data-modal-image-alt") || "";

    if (testimonialModalTitle) {
      testimonialModalTitle.textContent = title;
    }

    if (testimonialModalBody) {
      testimonialModalBody.innerHTML = fullCopy ? fullCopy.innerHTML : "";
    }

    if (testimonialModalAuthor) {
      testimonialModalAuthor.textContent = author;
    }

    if (testimonialModalImage) {
      testimonialModalImage.src = imageSrc;
      testimonialModalImage.alt = imageAlt;
    }

    testimonialLastFocus = trigger || document.activeElement;
    testimonialModal.hidden = false;
    document.body.classList.add("testimonial-modal-open");
    pauseTestimonialAutoplay();

    var closeButton = testimonialModal.querySelector(".testimonial-modal__close");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeTestimonialModal() {
    if (!testimonialModal) return;

    testimonialModal.hidden = true;
    document.body.classList.remove("testimonial-modal-open");

    if (testimonialModalImage) {
      testimonialModalImage.removeAttribute("src");
    }

    if (testimonialLastFocus && typeof testimonialLastFocus.focus === "function") {
      testimonialLastFocus.focus();
    }

    resumeTestimonialAutoplay();
  }

  document.querySelectorAll("[data-testimonial-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      var slide = button.closest("[data-testimonial-slide]");
      openTestimonialModal(slide, button);
    });
  });

  if (testimonialModal) {
    testimonialModal.querySelectorAll("[data-testimonial-close]").forEach(function (control) {
      control.addEventListener("click", closeTestimonialModal);
    });

    document.addEventListener("keydown", function (event) {
      if (testimonialModal.hidden) return;

      if (event.key === "Escape") {
        closeTestimonialModal();
      }
    });
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
  var phoneCode = document.getElementById("phone-code");
  var locationSelect = document.getElementById("wedding-location");
  var locationOtherWrap = document.getElementById("wedding-location-other-wrap");
  var locationOther = document.getElementById("wedding-location-other");

  function populatePhoneCodes() {
    var countries = window.PHONE_COUNTRIES;

    if (!phoneCode || !countries || !countries.length) return;

    var preferred = phoneCode.value || "CA";

    phoneCode.textContent = "";

    countries.forEach(function (country) {
      if (!country || !country.iso || !country.name || !country.dial) return;

      var option = document.createElement("option");
      option.value = country.iso;
      option.textContent = country.iso;
      option.setAttribute("data-name", country.name);

      if (country.iso === preferred) option.selected = true;

      phoneCode.appendChild(option);
    });
  }

  function enhancePhoneCode() {
    if (!phoneCode || !phoneCode.options.length || phoneCode.dataset.enhanced === "true") return;

    phoneCode.dataset.enhanced = "true";
    phoneCode.classList.add("phone-code__native");
    phoneCode.setAttribute("aria-hidden", "true");
    phoneCode.tabIndex = -1;

    var root = document.createElement("div");
    root.className = "phone-code";
    phoneCode.parentNode.insertBefore(root, phoneCode);
    root.appendChild(phoneCode);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "phone-code__button";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "phone-code-listbox");

    var isoLabel = document.createElement("span");
    isoLabel.className = "phone-code__value";
    button.appendChild(isoLabel);

    var menu = document.createElement("div");
    menu.className = "phone-code__menu";
    menu.hidden = true;

    var search = document.createElement("input");
    search.type = "search";
    search.className = "phone-code__search";
    search.placeholder = "Search country";
    search.setAttribute("aria-label", "Search countries");
    search.setAttribute("aria-autocomplete", "list");
    search.setAttribute("aria-controls", "phone-code-listbox");
    search.autocomplete = "off";

    var list = document.createElement("ul");
    list.className = "phone-code__list";
    list.id = "phone-code-listbox";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Country codes");

    var empty = document.createElement("p");
    empty.className = "phone-code__empty";
    empty.textContent = "No countries found";
    empty.hidden = true;

    menu.appendChild(search);
    menu.appendChild(list);
    menu.appendChild(empty);
    root.appendChild(button);
    root.appendChild(menu);

    var activeIndex = -1;

    function selectedOption() {
      return phoneCode.options[phoneCode.selectedIndex] || null;
    }

    function renderValue() {
      var option = selectedOption();
      if (!option) return;

      var name = option.getAttribute("data-name") || option.value;

      isoLabel.textContent = option.value;
      button.setAttribute("aria-label", "Country code, " + name);
    }

    function visibleOptions() {
      return Array.prototype.slice.call(list.querySelectorAll(".phone-code__option"));
    }

    function setActive(index) {
      var options = visibleOptions();

      if (!options.length) {
        activeIndex = -1;
        search.removeAttribute("aria-activedescendant");
        return;
      }

      if (index < 0) index = options.length - 1;
      if (index >= options.length) index = 0;

      activeIndex = index;

      options.forEach(function (option, i) {
        option.classList.toggle("is-active", i === index);
      });

      search.setAttribute("aria-activedescendant", options[index].id);

      var listRect = list.getBoundingClientRect();
      var optionRect = options[index].getBoundingClientRect();

      if (optionRect.top < listRect.top) {
        list.scrollTop -= listRect.top - optionRect.top;
      } else if (optionRect.bottom > listRect.bottom) {
        list.scrollTop += optionRect.bottom - listRect.bottom;
      }
    }

    function renderList(query) {
      var q = (query || "").trim().toLowerCase();

      list.textContent = "";

      Array.prototype.forEach.call(phoneCode.options, function (option) {
        var name = option.getAttribute("data-name") || option.textContent;
        var haystack = (name + " " + option.value).toLowerCase();

        if (q && haystack.indexOf(q) === -1) return;

        var item = document.createElement("li");
        item.className = "phone-code__option";
        item.id = "phone-code-opt-" + option.value;
        item.setAttribute("role", "option");
        item.setAttribute("data-value", option.value);
        item.setAttribute("aria-selected", option.selected ? "true" : "false");
        item.setAttribute("aria-label", name);
        item.textContent = option.value;

        if (option.selected) item.classList.add("is-selected");

        item.addEventListener("mousedown", function (event) {
          event.preventDefault();
          choose(option.value);
        });

        list.appendChild(item);
      });

      var hasMatches = list.children.length > 0;
      list.hidden = !hasMatches;
      empty.hidden = hasMatches;

      var selected = list.querySelector(".is-selected");
      var options = visibleOptions();
      var start = selected ? options.indexOf(selected) : 0;

      if (hasMatches) setActive(start);
    }

    function openMenu() {
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
      search.value = "";
      renderList("");
      search.focus();
    }

    function closeMenu() {
      if (menu.hidden) return;

      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      search.removeAttribute("aria-activedescendant");
      list.textContent = "";
    }

    function choose(iso) {
      phoneCode.value = iso;
      renderValue();
      closeMenu();
      button.focus();
    }

    button.addEventListener("click", function () {
      if (menu.hidden) openMenu();
      else closeMenu();
    });

    search.addEventListener("input", function () {
      renderList(search.value);
    });

    search.addEventListener("keydown", function (event) {
      var options = visibleOptions();

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActive(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActive(options.length - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (options[activeIndex]) choose(options[activeIndex].getAttribute("data-value"));
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        button.focus();
      }
    });

    document.addEventListener("mousedown", function (event) {
      if (!root.contains(event.target)) closeMenu();
    });

    root.addEventListener("focusout", function (event) {
      if (!root.contains(event.relatedTarget)) closeMenu();
    });

    renderValue();
  }

  function setLocationOther(isOther) {
    if (!locationOtherWrap || !locationOther) return;

    locationOtherWrap.hidden = !isOther;
    locationOther.disabled = !isOther;

    if (!isOther) {
      locationOther.value = "";
      clearError(locationOther);
    }
  }

  function validateLocationOther() {
    if (!locationSelect || locationSelect.value !== "Other" || !locationOther) {
      return true;
    }

    if (!locationOther.value.trim()) {
      showError(locationOther, "Please enter your wedding location.");
      return false;
    }

    clearError(locationOther);
    return true;
  }

  populatePhoneCodes();
  enhancePhoneCode();

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

    if (locationSelect) {
      locationSelect.addEventListener("change", function () {
        var isOther = locationSelect.value === "Other";

        setLocationOther(isOther);

        if (isOther && locationOther) locationOther.focus();
      });
    }

    if (locationOther) {
      locationOther.addEventListener("input", function () {
        if (locationOther.getAttribute("aria-invalid") === "true") {
          validateLocationOther();
        }
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;

      requiredFields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) {
          firstInvalid = field;
        }
      });

      if (!validateLocationOther() && !firstInvalid) {
        firstInvalid = locationOther;
      }

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

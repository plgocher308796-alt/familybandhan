/* =====================================================================
   FamilyBandhan — main.js
   No dependencies. Loaded with `defer`, so the DOM is ready when it runs.
   ===================================================================== */
(function () {
  "use strict";

  /* ===== 1. CONTACT SETTINGS — edit these three lines ===== */
  var PHONE_DIGITS = "917742583308";          // WhatsApp: country code + number, digits only
  var PHONE_DISPLAY = "77425 83308";          // shown on the page after "+91 "
  var EMAIL = "hello@familybandhan.com";
  /* Optional: paste a Formspree / Getform / Google Apps Script URL here to
     ALSO receive form submissions by email. Leave "" to use WhatsApp only. */
  var FORM_ENDPOINT = "";
  /* ======================================================== */

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function waLink(message) {
    return "https://wa.me/" + PHONE_DIGITS + "?text=" + encodeURIComponent(message);
  }

  /* ---------- Contact details ---------- */
  $$(".js-phone").forEach(function (el) { el.textContent = PHONE_DISPLAY; });
  $$(".js-tel").forEach(function (el) { el.href = "tel:+" + PHONE_DIGITS; });
  $$(".js-email").forEach(function (el) { el.textContent = EMAIL; });
  $$(".js-mail").forEach(function (el) { el.href = "mailto:" + EMAIL; });
  $$(".js-wa").forEach(function (el) {
    el.href = waLink("Hello FamilyBandhan, I'd like to know more about your services.");
  });
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Mobile navigation ---------- */
  var burger = $("#burger");
  var mobileNav = $("#mobileNav");
  var header = $("#siteHeader");

  function setMenu(open) {
    mobileNav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      var first = mobileNav.querySelector("a");
      if (first) first.focus();
    }
  }
  if (burger && mobileNav) {
    burger.addEventListener("click", function () {
      setMenu(!mobileNav.classList.contains("is-open"));
    });
    mobileNav.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && mobileNav.classList.contains("is-open")) {
        setMenu(false);
        burger.focus();
      }
    });
    document.addEventListener("click", function (ev) {
      if (mobileNav.classList.contains("is-open") && !header.contains(ev.target)) setMenu(false);
    });
  }

  /* ---------- Sticky header shadow ---------- */
  function onScroll() { header.classList.toggle("is-stuck", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Highlight current section in desktop nav ---------- */
  var navLinks = $$(".nav-desktop a[href^='#']:not(.btn)");
  if ("IntersectionObserver" in window && navLinks.length) {
    var sectionById = {};
    navLinks.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) sectionById[sec.id] = a;
    });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          sectionById[e.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(sectionById).forEach(function (id) { navIO.observe(document.getElementById(id)); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Hide floating WhatsApp over the form / footer ---------- */
  var waFloat = $("#waFloat");
  var bookSection = $("#book");
  var footer = $(".site-footer");
  if (waFloat && "IntersectionObserver" in window) {
    var visible = {};
    var waIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id || e.target.tagName] = e.isIntersecting; });
      var any = Object.keys(visible).some(function (k) { return visible[k]; });
      waFloat.classList.toggle("is-hidden", any);
    });
    if (bookSection) waIO.observe(bookSection);
    if (footer) waIO.observe(footer);
  }

  /* ---------- "Book this" links pre-select the service ---------- */
  var serviceSelect = $("#fService");
  $$(".js-book").forEach(function (link) {
    link.addEventListener("click", function () {
      var card = link.closest("[data-service]");
      var name = link.getAttribute("data-service") || (card && card.getAttribute("data-service"));
      if (!name || !serviceSelect) return;
      var match = Array.prototype.find.call(serviceSelect.options, function (o) { return o.text === name; });
      if (match) {
        serviceSelect.value = match.value || match.text;
        clearError(serviceSelect);
      }
    });
  });

  /* ---------- Booking form ---------- */
  var form = $("#bookingForm");
  var status = $("#formStatus");

  function fieldOf(input) { return input.closest(".field"); }
  function showError(input) {
    var f = fieldOf(input); if (!f) return;
    f.classList.add("is-invalid");
    var err = f.querySelector(".error");
    if (err) input.setAttribute("aria-describedby", err.id);
    input.setAttribute("aria-invalid", "true");
  }
  function clearError(input) {
    var f = fieldOf(input); if (!f) return;
    f.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  }
  function validPhone(v) {
    var digits = v.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }
  function setStatus(kind, html) {
    status.className = "form-status " + (kind === "ok" ? "is-ok" : "is-err");
    status.innerHTML = html;
  }
  function formatDate(iso) {
    if (!iso) return "Flexible";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  if (form) {
    // today as the minimum date
    var dateInput = $("#fDate");
    if (dateInput) {
      var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
      dateInput.min = t.toISOString().slice(0, 10);
    }

    // live validation: clear error once the user fixes the field
    $$("input, select, textarea", form).forEach(function (el) {
      el.addEventListener("input", function () { clearError(el); });
      el.addEventListener("change", function () { clearError(el); });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      // honeypot: bots fill hidden fields, humans don't
      if (form.website.value) { setStatus("ok", "Thanks — we’ll be in touch."); return; }

      var invalid = [];
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var service = form.service.value;
      var area = form.area.value.trim();
      if (name.length < 2) invalid.push(form.name);
      if (!validPhone(phone)) invalid.push(form.phone);
      if (!service) invalid.push(form.service);
      if (!area) invalid.push(form.area);

      if (invalid.length) {
        invalid.forEach(showError);
        invalid[0].focus();
        setStatus("err", "Please check the highlighted fields.");
        return;
      }

      var lines = [
        "FamilyBandhan booking request",
        "",
        "Name: " + name,
        "Phone: " + phone,
        "Service: " + service,
        "Preferred date: " + formatDate(form.date.value),
        "Preferred time: " + form.time.value,
        "Parents' area: " + area,
        "I live in: " + (form.city.value.trim() || "-"),
        "Notes: " + (form.notes.value.trim() || "-")
      ];
      var message = lines.join("\n");
      var url = waLink(message);

      // optional: also send to an email endpoint (fire-and-forget)
      if (FORM_ENDPOINT) {
        try {
          fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ name: name, phone: phone, service: service, date: form.date.value, time: form.time.value, area: area, city: form.city.value, notes: form.notes.value }) }).catch(function () {});
        } catch (e) { /* ignore */ }
      }

      var win = window.open(url, "_blank", "noopener");
      if (!win) {
        // pop-up blocked (common on desktop) — offer a direct link and a call instead
        setStatus("err", "Your browser blocked the WhatsApp window. <a href=\"" + url + "\" target=\"_blank\" rel=\"noopener\">Tap here to open WhatsApp</a>, or call us on <a href=\"tel:+" + PHONE_DIGITS + "\">+91 " + PHONE_DISPLAY + "</a>.");
        return;
      }
      setStatus("ok", "WhatsApp has opened with your request. Press <b>Send</b> there and we’ll call you back within the day. <a href=\"" + url + "\" target=\"_blank\" rel=\"noopener\">Didn’t open? Tap here.</a>");
      form.reset();
      if (dateInput) dateInput.value = "";
    });
  }

})();

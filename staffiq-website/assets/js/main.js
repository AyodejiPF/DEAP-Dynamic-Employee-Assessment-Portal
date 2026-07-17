/* StaffiQ — site interactions (vanilla JS, no dependencies) */
(function () {
  "use strict";
  var doc = document;
  doc.documentElement.classList.add("js");

  /* Header shadow on scroll */
  var header = doc.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  var toggle = doc.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = doc.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    doc.querySelectorAll(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        doc.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && doc.body.classList.contains("nav-open")) {
        doc.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* FAQ accordion */
  doc.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      // close siblings for a clean single-open accordion
      var parent = item.parentElement;
      parent.querySelectorAll(".faq-item.open").forEach(function (o) {
        if (o !== item) { o.classList.remove("open"); o.querySelector(".faq-a").style.maxHeight = null; o.querySelector(".faq-q").setAttribute("aria-expanded", "false"); }
      });
      item.classList.toggle("open", !isOpen);
      q.setAttribute("aria-expanded", !isOpen ? "true" : "false");
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : null;
    });
  });

  /* Role tabs */
  var roleTabs = doc.querySelectorAll(".role-tab");
  if (roleTabs.length) {
    roleTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-role");
        roleTabs.forEach(function (t) { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
        tab.classList.add("active"); tab.setAttribute("aria-selected", "true");
        doc.querySelectorAll(".role-panel").forEach(function (p) {
          p.hidden = p.getAttribute("data-role") !== target;
        });
      });
    });
  }

  /* Pricing monthly / annual toggle */
  var priceToggle = doc.querySelector(".price-toggle");
  if (priceToggle) {
    priceToggle.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode");
        priceToggle.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        doc.querySelectorAll("[data-monthly]").forEach(function (el) {
          el.textContent = mode === "annual" ? el.getAttribute("data-annual") : el.getAttribute("data-monthly");
        });
        doc.querySelectorAll("[data-per]").forEach(function (el) {
          el.textContent = mode === "annual" ? "/ employee / month, billed yearly" : "/ employee / month";
        });
      });
    });
  }

  /* Scroll reveal */
  var reveals = doc.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* Contact / demo form (graceful, no backend) */
  doc.querySelectorAll("form[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      var name = data.get("name") || "";
      var company = data.get("company") || "";
      var email = data.get("email") || "";
      var size = data.get("size") || "";
      var msg = data.get("message") || "";
      var body = encodeURIComponent("Name: " + name + "\r\nCompany: " + company + "\r\nEmail: " + email + "\r\nTeam size: " + size + "\r\n\r\n" + msg);
      var success = form.querySelector(".form-success");
      if (success) { success.classList.add("show"); success.setAttribute("role", "status"); }
      form.querySelectorAll("input,select,textarea,button").forEach(function (el) { el.disabled = true; });
      // Open the user's mail client as the delivery mechanism for now.
      window.location.href = "mailto:hello@staffiq.ng?subject=StaffiQ%20demo%20request%20from%20" +
        encodeURIComponent(company || name) + "&body=" + body;
    });
  });

  /* Training catalogue track filter */
  var trackFilter = doc.querySelector(".track-filter");
  if (trackFilter) {
    var chips = trackFilter.querySelectorAll(".track-chip");
    var courses = doc.querySelectorAll("[data-track-card]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var t = chip.getAttribute("data-track");
        chips.forEach(function (c) { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
        chip.classList.add("active"); chip.setAttribute("aria-pressed", "true");
        courses.forEach(function (card) {
          var show = t === "all" || card.getAttribute("data-track-card") === t;
          card.classList.toggle("hide", !show);
        });
      });
    });
  }

  /* Sticky demo / WhatsApp CTA */
  var stickyCta = doc.querySelector(".sticky-cta");
  if (stickyCta) {
    var toggleSticky = function () {
      window.requestAnimationFrame(function () {
        stickyCta.classList.toggle("show", window.scrollY > 420);
      });
    };
    window.addEventListener("scroll", toggleSticky, { passive: true });
    toggleSticky();
  }

  /* Pricing calculator */
  var calcUsers = doc.getElementById("calc-users");
  if (calcUsers) {
    var calcResults = doc.querySelectorAll(".calc-result");
    var formatNaira = function (n) {
      return "₦" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    var updateCalc = function () {
      var users = parseInt(calcUsers.value, 10);
      if (!users || users < 1) users = 1;
      calcResults.forEach(function (card) {
        var price = parseInt(card.getAttribute("data-price"), 10);
        var min = parseInt(card.getAttribute("data-min"), 10);
        var billable = Math.max(users, min);
        var total = billable * price;
        card.querySelector(".calc-total").textContent = formatNaira(total) + " / month";
        var note = card.querySelector(".calc-note");
        note.textContent = users < min ? "Billed at the " + min + " user minimum" : billable + " users";
      });
    };
    calcUsers.addEventListener("input", updateCalc);
    updateCalc();
  }

  /* Analytics event helper. Safe no op until the real GA4 Measurement ID replaces the
     placeholder in each page head; gtag() always exists once that script tag runs, it just
     will not send anywhere useful until the ID is real. */
  function track(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  /* Click tracking: WhatsApp contact and demo booking CTAs, site wide via delegation */
  doc.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest("a") : null;
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (href.indexOf("wa.me") !== -1) {
      track("contact", { method: "whatsapp", page: path });
    } else if (href.indexOf("contact.html") !== -1 && /book a demo|request a demo|send request/i.test(link.textContent || "")) {
      track("select_content", { content_type: "cta", item_id: "book_a_demo", page: path });
    }
  });

  /* Pricing calculator usage, fired once per session on first interaction */
  if (calcUsers) {
    var calcTracked = false;
    calcUsers.addEventListener("input", function () {
      if (calcTracked) return;
      calcTracked = true;
      track("pricing_calculator_used", { page: path });
    });
  }

  /* Footer year */
  var yr = doc.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  /* Active nav link by path */
  var path = location.pathname.split("/").pop() || "index.html";
  doc.querySelectorAll(".nav-links a, .mobile-menu a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    var linkPath = href;
    try {
      var url = new URL(href, location.href);
      if (url.origin !== location.origin && !href.endsWith(".html")) return;
      linkPath = url.pathname.split("/").pop() || "index.html";
    } catch (error) {
      linkPath = href.split("#")[0].split("?")[0] || "index.html";
    }
    if (linkPath === path || (path === "index.html" && linkPath === "index.html")) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });
})();

// ─── Pricing Page Monthly/Annual Toggle ──────────────────────────
(function () {
  var monthlyEls = document.querySelectorAll('.price-monthly');
  var annualEls = document.querySelectorAll('.price-annual');
  var toggleMonthly = document.getElementById('toggle-monthly');
  var toggleAnnual = document.getElementById('toggle-annual');

  if (!toggleMonthly || !toggleAnnual) return;

  function showInterval(interval) {
    var isAnnual = interval === 'annual';
    monthlyEls.forEach(function (el) { el.style.display = isAnnual ? 'none' : 'block'; });
    annualEls.forEach(function (el) { el.style.display = isAnnual ? 'block' : 'none'; });
    toggleMonthly.setAttribute('aria-checked', isAnnual ? 'false' : 'true');
    toggleAnnual.setAttribute('aria-checked', isAnnual ? 'true' : 'false');
    toggleMonthly.classList.toggle('active', !isAnnual);
    toggleAnnual.classList.toggle('active', isAnnual);
  }

  // Annual is default
  showInterval('annual');

  toggleMonthly.addEventListener('click', function () { showInterval('monthly'); });
  toggleAnnual.addEventListener('click', function () { showInterval('annual'); });

  toggleMonthly.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showInterval('monthly'); } });
  toggleAnnual.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showInterval('annual'); } });
})();

/* --- StaffiQ premium experience loader (2026-07-17, additive, reversible) --- */
(function(){try{var s=document.createElement("script");s.src="/assets/js/experience.js";s.defer=true;document.head.appendChild(s);}catch(e){}})();

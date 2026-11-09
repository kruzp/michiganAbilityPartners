/* Michigan Ability Partners — site behavior. No dependencies. */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- text size ---------- */
  function setSize(v) {
    if (v) root.dataset.text = v; else delete root.dataset.text;
    $$(".textsize button").forEach(function (b) { b.setAttribute("aria-pressed", String((b.dataset.size || "") === (v || ""))); });
    try { if (v) localStorage.setItem("map-text", v); else localStorage.removeItem("map-text"); } catch (e) {}
    requestAnimationFrame(drawJunction);
  }
  $$(".textsize button").forEach(function (b) { b.addEventListener("click", function () { setSize(b.dataset.size); }); });
  setSize(root.dataset.text || "");

  /* ---------- header + drawer ---------- */
  var hdr = $(".hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-stuck", window.scrollY > 60); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var drawer = $("#drawer"), menuBtn = $(".menu-btn");
  function openMenu(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    menuBtn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (open) $(".drawer__close").focus(); else menuBtn.focus();
  }
  if (menuBtn) menuBtn.addEventListener("click", function () { openMenu(true); });
  if (drawer) {
    $(".drawer__close").addEventListener("click", function () { openMenu(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { openMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) openMenu(false); });
  }

  /* ---------- reveal + counters + scale bars ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || "0", 10);
    var small = el.querySelector("small"); var suffix = small ? small.outerHTML : "";
    if (reduce) return;
    var t0 = null, dur = 1400;
    function fmt(v) { return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = fmt(target * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add("is-in");
      var n = el.querySelector("[data-count]"); if (n) countUp(n);
      var sb = el.querySelector("[data-pct]");
      if (sb) { var f = sb.querySelector(".scalebar__fill"); setTimeout(function () { f.style.width = "calc(" + sb.dataset.pct + "% + 1.5px)"; }, 150); }
      if (el.matches("[data-lines]")) { el.classList.add("is-drawn"); drawJunction(true); }
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }) : null;
  $$(".rv, [data-lines]").forEach(function (el) {
    if (io) io.observe(el); else { el.classList.add("is-in", "is-drawn"); }
  });

  /* ---------- system map junction (origin → each line) ---------- */
  var linesEl = $("[data-lines]");
  function drawJunction(animate) {
    if (!linesEl) return;
    var j = $(".lines__junction", linesEl), svg = $("svg", j);
    if (!j || getComputedStyle(j).display === "none") return;
    var jr = j.getBoundingClientRect(); if (!jr.height) return;
    var w = jr.width, oy = jr.height / 2, ox = 110;
    var colors = ["var(--l-housing)", "var(--l-payee)", "var(--l-vets)", "var(--l-evict)"];
    var paths = "";
    $$(".line__rail", linesEl).forEach(function (rail, i) {
      var r = rail.getBoundingClientRect();
      var y = r.top + r.height / 2 - jr.top;
      var spread = (i - 1.5) * 10;
      var d = "M" + ox + " " + (oy + spread) + " C" + (ox + w * 0.42) + " " + (oy + spread) + " " + (w * 0.55) + " " + y + " " + (w + 2) + " " + y;
      paths += '<path class="junction-path" stroke="' + colors[i] + '" d="' + d + '"/>';
    });
    paths += '<circle cx="' + ox + '" cy="' + oy + '" r="22" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"/><circle cx="' + ox + '" cy="' + oy + '" r="7" fill="var(--ink)"/>';
    svg.setAttribute("viewBox", "0 0 " + w + " " + jr.height);
    svg.innerHTML = paths;
    if (animate === true && !reduce) {
      $$(".junction-path", svg).forEach(function (p, i) {
        var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
        p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1) " + (i * 0.12) + "s";
        p.style.strokeDashoffset = 0;
      });
    }
    var origin = $(".lines__origin", j); if (origin) { origin.style.top = (oy - 17) + "px"; origin.style.left = "0px"; origin.style.width = "76px"; origin.style.transform = "none"; origin.style.textAlign = "right"; }
  }
  if (linesEl) {
    window.addEventListener("resize", function () { drawJunction(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawJunction(false); });
    drawJunction(false);
  }

  /* ---------- trip planner ---------- */
  var OFFICES = {
    aa: { name: "Ann Arbor office", phone: "734-975-6880", tel: "+17349756880" },
    jx: { name: "Jackson office", phone: "517-841-5780", tel: "+15178415780" }
  };
  var ROUTES = {
    evict: {
      line: "evict", c: "var(--l-evict)", code: "Line 04 · Eviction Prevention", title: "Eviction Prevention",
      lede: "Emergency rent help — up to $3,000 — so you can stay in your home.",
      stops: [["Have your summons", "Stop 1"], ["Fill out the inquiry", "Stop 2"], ["Team review", "Stop 3"], ["Stay in your home", "Destination"]],
      bring: ["Your court summons for eviction (nonpayment of rent)", "The total amount you owe"],
      first: "Fill out the short inquiry form. A team member will contact you about next steps.",
      cta: ["Start the inquiry", "eviction-prevention.html#inquiry"],
      warn: "Balances over $3,000 can't be approved. Help depends on eligibility and available funds — apply as soon as you get your summons."
    },
    housing: {
      line: "housing", c: "var(--l-housing)", code: "Line 01 · Housing", title: "Permanent Supportive Housing",
      lede: "Subsidized rent, a case manager in your corner, and help building the routines that keep a home.",
      stops: [["Call HAWC", "Stop 1"], ["Referral to MAP", "Stop 2"], ["Move-in support", "Stop 3"], ["Stay housed", "Destination"]],
      bring: ["Documentation of your disability", "Anything showing your current housing situation and income"],
      first: "Call HAWC (Housing Access for Washtenaw County) at (734) 961-1999. MAP takes housing referrals through HAWC.",
      cta: ["Call HAWC · (734) 961-1999", "tel:+17349611999"]
    },
    vets: {
      line: "vets", c: "var(--l-vets)", code: "Line 03 · Veteran Services", title: "Homeless Veterans' Reintegration",
      lede: "Job training, placement and follow-up from a team that works with Veterans every day.",
      stops: [["Send a referral", "Stop 1"], ["Job readiness", "Stop 2"], ["Placement", "Stop 3"], ["Steady work", "Destination"]],
      bring: ["Your DD-214 or proof of service (not a dishonorable discharge)", "Your résumé, if you have one — we can help build it"],
      first: "Fill out the online referral form, or call and we'll do it with you.",
      cta: ["Learn about the program", "veteran-services.html"]
    },
    payee: {
      line: "payee", c: "var(--l-payee)", code: "Line 02 · Representative Payee", title: "Representative Payee",
      lede: "MAP receives your benefits, pays rent, utilities and food first, and helps you build a budget that holds.",
      stops: [["Apply any time", "Stop 1"], ["First meeting", "Stop 2"], ["Budget together", "Stop 3"], ["Bills paid on time", "Destination"]],
      bring: ["Copies of your essential bills (rent, utilities, phone)", "Your Social Security, SSI or VA benefit information"],
      first: "Get the application, or call and we'll walk you through it.",
      cta: ["See how it works", "representative-payee.html"]
    },
    unsure: {
      line: "talk", c: "var(--ink-2)", code: "Start with a conversation", title: "Talk to a person at MAP",
      lede: "Not knowing where to start is normal. Tell us what's going on, and we'll help you find your route — inside MAP or with a partner.",
      stops: [["Call or walk in", "Stop 1"], ["Talk it through", "Stop 2"], ["Your route", "Destination"]],
      bring: ["Nothing required — just you", "Any letters or bills that are worrying you can help"],
      first: "Call the office nearest you during open hours."
    }
  };

  var planner = $("[data-planner]"), ticket = $("[data-ticket]");
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function renderTicket() {
    if (!planner || !ticket) return;
    var cEl = planner.querySelector("input[name=county]:checked"), nEl = planner.querySelector("input[name=need]:checked");
    var county = cEl ? cEl.value : null, need = nEl ? nEl.value : null;
    $("[data-tk-county]", ticket).textContent = county ? (county === "other" ? "Outside our area" : county + " County") : "—";
    if (!need) return;
    var R = JSON.parse(JSON.stringify(ROUTES[need]));
    var off = county === "Jackson" ? OFFICES.jx : OFFICES.aa;
    var notes = [];

    if (need === "evict" && county && county !== "Washtenaw") {
      R = {
        line: "talk", c: "var(--ink-2)", code: "Line 04 · Not available here", title: "Let's find another route",
        lede: "Eviction Prevention funds are only for Washtenaw County renters. You still have options, and we'll help you find them.",
        stops: [["Call MAP", "Stop 1"], ["Get connected to local help", "Stop 2"], ["Stay in your home", "Destination"]],
        bring: ["Your court summons and the amount you owe"],
        first: "Call the " + off.name + ", or dial 2-1-1 for emergency rental help near you.",
        cta: null
      };
    }
    if (need === "housing" && county && county !== "Washtenaw") {
      notes.push("MAP's permanent supportive housing is in Washtenaw County, and referrals come through HAWC. Living elsewhere? Call the " + off.name + " and we'll help with next steps.");
    }
    if (county === "other") notes.push("MAP serves Jackson, Livingston, Oakland, Wayne and Washtenaw counties. Call us — we'll point you to the right help either way.");
    if (need === "unsure") R.cta = null;

    var start = county ? (county === "other" ? "You are here" : "You are here · " + county) : "You are here";
    var stops = [[start, "Start"]].concat(R.stops);
    var route = stops.map(function (s, i) {
      return '<li style="animation-delay:' + (0.1 + i * 0.12) + 's"><span>' + esc(s[0]) + "<small>" + esc(s[1]) + "</small></span></li>";
    }).join("");
    var bring = R.bring.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("");
    var acts = "";
    if (R.cta) acts += '<a class="btn btn--teal" href="' + R.cta[1] + '">' + esc(R.cta[0]) + "</a>";
    acts += '<a class="btn' + (R.cta ? " btn--ghost" : "") + '" href="tel:' + off.tel + '">Call ' + off.phone + "</a>";

    ticket.dataset.line = R.line;
    ticket.style.setProperty("--c", R.c);
    ticket.innerHTML =
      '<div class="ticket__band"><span>' + esc(R.code) + "</span><span data-tk-county>" + esc(county ? (county === "other" ? "Outside our area" : county + " County") : "Choose a county") + "</span></div>" +
      '<div class="ticket__body">' +
      "<h3>" + esc(R.title) + "</h3><p style=\"margin:0;color:var(--ink-2)\">" + esc(R.lede) + "</p>" +
      '<ol class="mroute" style="--c:' + R.c + '">' + route + "</ol>" +
      "<dl><div><dt>Your first step</dt><dd>" + esc(R.first) + "</dd></div><div><dt>What to bring</dt><dd><ul>" + bring + "</ul></dd></div>" +
      "<div><dt>Nearest office</dt><dd>" + off.name + " · " + off.phone + "</dd></div></dl>" +
      (R.warn ? '<div class="ticket__warn">' + esc(R.warn) + "</div>" : "") +
      notes.map(function (n) { return '<div class="ticket__warn" style="border-left-color:var(--teal);background:var(--paper-2)">' + esc(n) + "</div>"; }).join("") +
      '<div class="ticket__acts">' + acts + "</div>" +
      '<p class="ticket__note">Programs depend on eligibility and available funding. A MAP staff member will confirm what fits you.</p>' +
      "</div>";
  }
  if (planner) planner.addEventListener("change", renderTicket);

  /* ---------- office open/closed (Michigan time) ---------- */
  var HOURS = {
    aa: { 1: [[510, 720], [780, 990]], 3: [[510, 720], [780, 990]], 5: [[510, 720], [780, 990]], extra: [[510, 990]] },
    jx: { 1: [[600, 900]], 5: [[600, 900]], extra: [[600, 900]] }
  };
  var CLOSED = ["2026-01-01", "2026-01-19", "2026-05-25", "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-11-27", "2026-12-25"];
  function miNow() {
    try {
      var p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      return new Date(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute);
    } catch (e) { return new Date(); }
  }
  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function slotsFor(key, d) {
    if (CLOSED.indexOf(ymd(d)) > -1) return [];
    var dow = d.getDay(), H = HOURS[key];
    if (H[dow]) return H[dow];
    if ((d.getDate() === 1 || d.getDate() === 3) && dow !== 0 && dow !== 6) return H.extra;
    return [];
  }
  function hm(m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + ap; }
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function officeStatus(key) {
    var now = miNow(), mins = now.getHours() * 60 + now.getMinutes();
    var today = slotsFor(key, now);
    for (var i = 0; i < today.length; i++) {
      if (mins >= today[i][0] && mins < today[i][1]) return { open: true, text: "Open now · until " + hm(today[i][1]) };
      if (mins < today[i][0]) return { open: false, text: (i > 0 ? "Back at " : "Opens today ") + hm(today[i][0]) };
    }
    for (var k = 1; k <= 14; k++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k), s = slotsFor(key, d);
      if (s.length) return { open: false, text: "Closed · opens " + (k === 1 ? "tomorrow" : DAYS[d.getDay()]) + " " + hm(s[0][0]) };
    }
    return { open: false, text: "Closed now" };
  }
  $$("[data-office]").forEach(function (el) {
    var s = officeStatus(el.dataset.office), b = $("[data-status]", el);
    if (b) { b.textContent = s.text; b.classList.toggle("is-open", s.open); }
  });

  /* closures list: mark past + next */
  var cl = $("[data-closures]");
  if (cl) {
    var todayStr = ymd(miNow()), nextSet = false;
    $$("li", cl).forEach(function (li) {
      if (li.dataset.date < todayStr) li.classList.add("is-past");
      else if (!nextSet) { li.classList.add("is-next"); nextSet = true; }
    });
  }

  /* ---------- stops progress (program pages) + history fill ---------- */
  var stopsEls = $$("[data-stops]"), hist = $("[data-history]");
  function progress() {
    var vh = window.innerHeight;
    stopsEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (vh * 0.65 - r.top) / r.height));
      el.style.setProperty("--p", reduce ? 1 : p);
    });
    if (hist) {
      var r = hist.getBoundingClientRect(), line = vh * 0.55;
      var h = Math.max(0, Math.min(r.height, line - r.top));
      hist.querySelector(".history__fill").style.height = (reduce ? r.height : h) + "px";
      $$(".yr", hist).forEach(function (y) { y.classList.toggle("is-past", reduce || y.getBoundingClientRect().top < line); });
    }
  }
  if (stopsEls.length || hist) { window.addEventListener("scroll", progress, { passive: true }); window.addEventListener("resize", progress); progress(); }

  /* ---------- forms → email (no server) ---------- */
  function mailto(subject, lines) {
    return "mailto:info@mapagency.org?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
  }
  function showMsg(form, text, warn) {
    var m = $("[data-msg]", form); m.textContent = text; m.classList.add("is-on"); m.classList.toggle("warn", !!warn);
  }
  var ev = $("[data-evict]");
  if (ev) ev.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = ev.elements, summons = ev.querySelector("input[name=summons]:checked");
    if (!f.name.value.trim() || !f.phone.value.trim() || !f.address.value.trim()) { showMsg(ev, "Please add your name, phone number and rental address.", true); return; }
    if (!summons) { showMsg(ev, "Please tell us whether you've received a court summons.", true); return; }
    var owed = parseFloat(String(f.owed.value).replace(/[^0-9.]/g, ""));
    if (summons.value === "No") { showMsg(ev, "This fund requires a court summons for nonpayment of rent. Please call 734-975-6880 — we can still talk through your options.", true); return; }
    if (owed > 3000) { showMsg(ev, "Balances over $3,000 can't be approved by this fund. Please call 734-975-6880 so our staff can help you look at other options.", true); return; }
    showMsg(ev, "Your email app should open with your inquiry filled in. Press send there to reach MAP. If nothing opens, call 734-975-6880 or email info@mapagency.org.");
    window.location.href = mailto("Eviction Prevention inquiry — " + f.name.value.trim(), [
      "Name: " + f.name.value, "Phone: " + f.phone.value, "Email: " + f.email.value, "Rental address: " + f.address.value,
      "Court summons received: " + summons.value, "Amount owed: " + (f.owed.value || "not given")]);
  });
  var ct = $("[data-contact]");
  if (ct) ct.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = ct.elements;
    if (!f.name.value.trim() || !f.reply.value.trim() || !f.message.value.trim()) { showMsg(ct, "Please fill in your name, how to reach you, and a message.", true); return; }
    showMsg(ct, "Your email app should open with your message ready. Press send there. If nothing opens, email info@mapagency.org directly.");
    window.location.href = mailto(f.topic.value + " — " + f.name.value.trim(), [f.message.value, "", "— " + f.name.value, "Reply to: " + f.reply.value]);
  });

  $$("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();

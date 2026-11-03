/* SEO Lab — progressive enhancement: menu, table roles, offer-check score, audit form. */
(function () {
  "use strict";
  document.documentElement.classList.add("scripted");
  // Keep table semantics when the narrow-screen reflow changes display (Safari drops implicit roles).
  var roles = { TABLE: "table", THEAD: "rowgroup", TBODY: "rowgroup", TFOOT: "rowgroup", TR: "row", TD: "cell" };
  document.querySelectorAll(".tariff-table, .tariff-table *, .ledger, .ledger *").forEach(function (el) {
    var r = el.tagName === "TH" ? (el.scope === "col" ? "columnheader" : "rowheader") : roles[el.tagName];
    if (r) el.setAttribute("role", r);
  });
  var toggle = document.querySelector(".menu-toggle");
  var list = document.getElementById("nav-items");
  if (toggle && list) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      list.setAttribute("data-open", open ? "true" : "false");
    };
    toggle.hidden = false;
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
    });
    list.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("focusin", function (e) { if (!list.contains(e.target) && e.target !== toggle) setOpen(false); });
  }
  // offer check: CSS counters draw the score; <output> (role=status) carries it for screen readers
  var oc = document.querySelector(".offer-check output"), tally = function () { var s = 0, n = 0; oc.form.querySelectorAll("[type=radio]:checked").forEach(function (r) { s += +r.value; n++; }); oc.value = oc.dataset.t.replace("N", n).replace("S", s); };
  if (oc) { oc.defaultValue = oc.dataset.t.replace("N", 0).replace("S", 0); tally(); oc.form.addEventListener("change", tally); }
  var form = document.querySelector("form.audit-form"); // Netlify removes data-netlify from deployed HTML
  if (!form || !window.fetch || !window.URLSearchParams || !window.FormData) return;
  var d = form.dataset, msg = form.querySelector(".form-msg"), box = form.querySelector(".form-errs"), button = form.querySelector("[type=submit]");
  form.noValidate = true;
  var q = /[?&]tarifi=(\w+)/.exec(location.search); // tier chosen in the /tarifebi/ table
  if (q && form.elements.tarifi) form.elements.tarifi.value = q[1];
  document.addEventListener("click", function (e) {
    var tier = e.target.closest("[data-tier]");
    if (tier && form.elements.tarifi) form.elements.tarifi.value = tier.getAttribute("data-tier");
  });
  var say = function (text, state) {
    msg.textContent = text || "";
    if (state) msg.setAttribute("data-state", state); else msg.removeAttribute("data-state");
  };
  var validate = function () {
    var bad = [], ul = box.querySelector("ul");
    form.querySelectorAll("[required]").forEach(function (f) {
      var text = f.validity.valueMissing ? d.errRequired : (f.validity.valid ? "" : (f.type === "email" ? d.errMail : d.errDomain));
      var out = document.getElementById(f.id + "-err");
      f.setAttribute("aria-invalid", text ? "true" : "false");
      if (out) { out.textContent = text; out.hidden = !text; }
      if (text) bad.push([f, text]);
    });
    ul.textContent = "";
    bad.forEach(function (b) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + b[0].id;
      a.textContent = b[0].labels[0].firstChild.textContent.trim() + " — " + b[1];
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.hidden = !bad.length;
    if (bad.length) box.focus();
    return !bad.length;
  };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) { say(""); return; }
    button.disabled = true;
    say(d.sending, "");
    fetch("/p-26480e/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      form.reset();
      say(d.success, "ok");
      msg.setAttribute("tabindex", "-1");
      msg.focus();
    }).catch(function () { say(d.error, "err"); })
      .then(function () { button.disabled = false; });
  });
})();

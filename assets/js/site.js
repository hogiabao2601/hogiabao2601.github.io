(function () {
  "use strict";

  // Local time in Singapore, shown in the top bar.
  var clock = document.getElementById("clock");
  if (clock && window.Intl && Intl.DateTimeFormat) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Singapore"
    });
    var tick = function () {
      clock.textContent = "Singapore " + fmt.format(new Date());
    };
    tick();
    setInterval(tick, 20000);
  }

  // Keep the footer year current.
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Copy email address.
  var copy = document.querySelector("[data-copy]");
  if (copy && navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener("click", function () {
      navigator.clipboard.writeText(copy.getAttribute("data-copy")).then(
        function () {
          copy.textContent = "copied";
          copy.setAttribute("data-done", "");
          setTimeout(function () {
            copy.textContent = "copy";
            copy.removeAttribute("data-done");
          }, 1800);
        },
        function () {
          var email = document.querySelector(".email");
          if (!email || !window.getSelection) return;
          var range = document.createRange();
          range.selectNodeContents(email);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      );
    });
  }

  // Mark the nav link for the section in view.
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  if (links.length && "IntersectionObserver" in window) {
    var byId = {};
    links.forEach(function (a) {
      byId[a.getAttribute("href").slice(1)] = a;
    });
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            a.removeAttribute("aria-current");
          });
          var active = byId[entry.target.id];
          if (active) active.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  // Transaction stream: a small simulation of transaction monitoring.
  // Dots move left to right; at the rule most turn "cleared", a few are
  // flagged and drop into the review lane. Purely illustrative.
  var canvas = document.getElementById("stream");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = getComputedStyle(document.documentElement);
  var color = function (name, fallback) {
    var v = css.getPropertyValue(name).trim();
    return v || fallback;
  };
  var C = {
    lane: color("--line", "#212833"),
    idle: color("--text-3", "#7f8793"),
    clear: color("--clear", "#62c3a5"),
    flag: color("--signal", "#f0b84d"),
    flagFaint: color("--signal-faint", "rgba(240,184,77,.32)"),
    rule: color("--line-2", "#2f3744")
  };

  var LANES = 5;
  var COUNT = 44;
  var W = 0, H = 0, ruleX = 0, reviewY = 0, lanes = [], dots = [];
  var running = false, last = 0, visible = true, paused = false;
  var toggle = document.getElementById("stream-toggle");

  var seed = 20140301;
  var rnd = function () {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ruleX = Math.round(W * (W < 560 ? 0.58 : 0.62));
    var top = 46, bottom = H - 46;
    lanes = [];
    for (var i = 0; i < LANES; i++) lanes.push(Math.round(top + ((bottom - top) * i) / (LANES - 1)));
    reviewY = H - 30;
    dots.forEach(function (d) {
      if (d.state !== "flag") d.y = lanes[d.lane];
    });
  }

  function spawn(x) {
    var lane = Math.floor(rnd() * LANES);
    dots.push({
      x: x,
      y: lanes[lane],
      lane: lane,
      v: 38 + rnd() * 46,
      r: 2 + rnd() * 1.4,
      state: "idle",
      flagged: rnd() < 0.05,
      t: 0
    });
  }

  function populate() {
    dots = [];
    for (var i = 0; i < COUNT; i++) spawn(rnd() * W);
  }

  function step(dt) {
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.x += d.v * dt;
      if (d.state === "idle" && d.x >= ruleX) {
        d.state = d.flagged ? "flag" : "clear";
        d.t = 0;
      }
      if (d.state === "flag") {
        d.t += dt;
        d.y += (reviewY - d.y) * Math.min(1, dt * 2.4);
        d.v = Math.max(16, d.v - 34 * dt);
      }
    }
    dots = dots.filter(function (d) {
      return d.x < W + 16;
    });
    while (dots.length < COUNT) spawn(-12 - rnd() * 80);
  }

  function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;

    ctx.strokeStyle = C.lane;
    for (var i = 0; i < lanes.length; i++) line(0, lanes[i] + 0.5, W, lanes[i] + 0.5);

    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = C.flagFaint;
    line(ruleX, reviewY + 0.5, W, reviewY + 0.5);

    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = C.rule;
    line(ruleX + 0.5, 34, ruleX + 0.5, H - 8);
    ctx.setLineDash([]);

    for (var j = 0; j < dots.length; j++) {
      var d = dots[j];
      ctx.globalAlpha = d.state === "idle" ? 0.7 : 1;
      ctx.fillStyle = d.state === "idle" ? C.idle : d.state === "clear" ? C.clear : C.flag;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      if (d.state === "flag" && d.t < 1.4) {
        ctx.globalAlpha = (1 - d.t / 1.4) * 0.7;
        ctx.strokeStyle = C.flag;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r + d.t * 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(ts) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    step(dt);
    draw();
    window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce || paused || !visible || document.hidden) return;
    running = true;
    last = 0;
    window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
  }

  resize();
  populate();
  // Settle into a representative frame, so the still image (and the
  // reduced-motion view) already shows cleared and flagged transactions.
  for (var s = 0; s < 240; s++) step(1 / 30);
  draw();

  // Visible pause control, so the motion can be stopped (WCAG 2.2.2).
  if (toggle && !reduce) {
    toggle.hidden = false;
    toggle.addEventListener("click", function () {
      paused = !paused;
      toggle.setAttribute("aria-pressed", paused ? "true" : "false");
      toggle.textContent = paused ? "play" : "pause";
      if (paused) stop();
      else start();
    });
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(function () {
      resize();
      draw();
    }).observe(canvas);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });
})();

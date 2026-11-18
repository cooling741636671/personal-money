(() => {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let petals = [];
  let dots = [];
  let t = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = Math.max(window.innerHeight, document.documentElement.scrollHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawn();
  }

  function spawn() {
    const count = Math.min(28, Math.floor(width / 40));
    petals = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 6 + Math.random() * 12,
      speed: 0.25 + Math.random() * 0.55,
      drift: (Math.random() - 0.5) * 0.45,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      alpha: 0.18 + Math.random() * 0.28,
      hue: Math.random() > 0.45 ? 340 : 200,
    }));

    dots = Array.from({ length: Math.min(40, Math.floor(width / 30)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -0.05 - Math.random() * 0.25,
      alpha: 0.15 + Math.random() * 0.35,
    }));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
    if (p.hue > 300) {
      g.addColorStop(0, "rgba(255, 190, 210, 0.95)");
      g.addColorStop(1, "rgba(255, 160, 190, 0)");
    } else {
      g.addColorStop(0, "rgba(170, 215, 255, 0.9)");
      g.addColorStop(1, "rgba(140, 190, 240, 0)");
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * 0.55, p.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function frame() {
    t += 1;
    ctx.clearRect(0, 0, width, height);

    // soft aurora wash like old blog themes
    const wash = ctx.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, "rgba(220, 236, 255, 0.35)");
    wash.addColorStop(0.5, "rgba(255, 230, 240, 0.22)");
    wash.addColorStop(1, "rgba(220, 245, 230, 0.28)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    for (const d of dots) {
      d.x += d.vx + Math.sin((t + d.y) * 0.01) * 0.15;
      d.y += d.vy;
      if (d.y < -10) {
        d.y = height + 10;
        d.x = Math.random() * width;
      }
      if (d.x < -10) d.x = width + 10;
      if (d.x > width + 10) d.x = -10;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${d.alpha})`;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of petals) {
      p.y += p.speed;
      p.x += p.drift + Math.sin(t * 0.01 + p.y * 0.01) * 0.35;
      p.rot += p.spin;
      if (p.y > height + 30) {
        p.y = -30;
        p.x = Math.random() * width;
      }
      drawPetal(p);
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    resize();
    if (reduceMotion) {
      ctx.clearRect(0, 0, width, height);
      const wash = ctx.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, "rgba(220, 236, 255, 0.4)");
      wash.addColorStop(1, "rgba(255, 230, 240, 0.28)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => {
    clearTimeout(window.__bgResizeTimer);
    window.__bgResizeTimer = setTimeout(start, 120);
  });

  start();
})();

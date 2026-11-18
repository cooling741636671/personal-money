(() => {
  try {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;

    // 微信里用更轻的静态背景，避免兼容问题
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent || "");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isWeChat || reduceMotion) {
      canvas.style.display = "none";
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      canvas.style.display = "none";
      return;
    }

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
      height = Math.max(window.innerHeight, document.documentElement.scrollHeight || window.innerHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    }

    function spawn() {
      const count = Math.min(22, Math.floor(width / 48));
      petals = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 5 + Math.random() * 10,
        speed: 0.2 + Math.random() * 0.45,
        drift: (Math.random() - 0.5) * 0.4,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.015,
        alpha: 0.14 + Math.random() * 0.22,
        pink: Math.random() > 0.4,
      }));
      dots = Array.from({ length: Math.min(30, Math.floor(width / 36)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.04 - Math.random() * 0.2,
        alpha: 0.12 + Math.random() * 0.28,
      }));
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
      if (p.pink) {
        g.addColorStop(0, "rgba(255, 190, 210, 0.9)");
        g.addColorStop(1, "rgba(255, 160, 190, 0)");
      } else {
        g.addColorStop(0, "rgba(170, 215, 255, 0.85)");
        g.addColorStop(1, "rgba(140, 190, 240, 0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 0.5, p.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      t += 1;
      ctx.clearRect(0, 0, width, height);

      for (const d of dots) {
        d.x += d.vx + Math.sin((t + d.y) * 0.01) * 0.12;
        d.y += d.vy;
        if (d.y < -10) {
          d.y = height + 10;
          d.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${d.alpha})`;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of petals) {
        p.y += p.speed;
        p.x += p.drift + Math.sin(t * 0.01 + p.y * 0.01) * 0.3;
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
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", () => {
      clearTimeout(window.__bgResizeTimer);
      window.__bgResizeTimer = setTimeout(start, 150);
    });

    start();
  } catch (_) {
    const canvas = document.getElementById("bg-canvas");
    if (canvas) canvas.style.display = "none";
  }
})();

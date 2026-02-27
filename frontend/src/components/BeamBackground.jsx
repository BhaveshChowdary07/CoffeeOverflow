import { useEffect, useRef } from "react";

export function BeamsBackground({ children, intensity = "strong" }) {
  const canvasRef = useRef(null);
  const beamsRef = useRef([]);
  const animationFrameRef = useRef(null);

  const MINIMUM_BEAMS = 28;

  const opacityMap = {
    subtle: 0.5,
    medium: 0.75,
    strong: 1,
  };

  function createBeam(w, h) {
    const angle = -35 + Math.random() * 10;
    return {
      x: Math.random() * w * 1.5 - w * 0.25,
      y: Math.random() * h * 1.5 - h * 0.25,
      width: 30 + Math.random() * 60,
      length: h * 2.5,
      angle,
      speed: 0.5 + Math.random() * 1.0,
      opacity: 0.12 + Math.random() * 0.16,
      hue: 160 + Math.random() * 40, // emerald-teal medical range
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.018 + Math.random() * 0.025,
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let running = true;

    // Logical (CSS) dimensions tracked separately to avoid confusion
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      cssW = window.innerWidth;
      cssH = window.innerHeight;

      // Physical pixel size
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;

      // CSS display size stays at viewport
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      // Reset transform then apply DPR scale once
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Rebuild beams using CSS dimensions
      beamsRef.current = Array.from({ length: MINIMUM_BEAMS }, () =>
        createBeam(cssW, cssH)
      );
    };

    resize();
    window.addEventListener("resize", resize);

    function animate() {
      if (!running) return;

      // Always clear with CSS dimensions (ctx is already scaled)
      ctx.clearRect(0, 0, cssW, cssH);

      // Apply blur filter once per frame, then draw all beams
      ctx.save();
      ctx.filter = "blur(32px)";

      beamsRef.current.forEach((beam) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        // Recycle beam when it scrolls fully off top
        if (beam.y + beam.length < 0) {
          beam.y = cssH + 100;
          beam.x = Math.random() * cssW * 1.5 - cssW * 0.25;
        }

        const alpha =
          beam.opacity *
          (0.8 + Math.sin(beam.pulse) * 0.2) *
          (opacityMap[intensity] ?? 1);

        const grad = ctx.createLinearGradient(0, 0, 0, beam.length);
        grad.addColorStop(0, `hsla(${beam.hue},85%,70%,0)`);
        grad.addColorStop(0.5, `hsla(${beam.hue},85%,55%,${alpha})`);
        grad.addColorStop(1, `hsla(${beam.hue},85%,70%,0)`);

        ctx.save();
        ctx.translate(beam.x, beam.y);
        ctx.rotate((beam.angle * Math.PI) / 180);
        ctx.fillStyle = grad;
        ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
        ctx.restore();
      });

      ctx.restore(); // pops blur filter

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [intensity]);

  return (
    // Dark navy background so beams are vivid — NOT the beige app background
    <div className="relative w-full min-h-screen overflow-hidden bg-slate-900">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* Subtle noise-texture overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
import { useEffect, useRef } from "react";

export function BeamsBackground({ children, intensity = "strong" }) {
  const canvasRef = useRef(null);
  const beamsRef = useRef([]);
  const animationFrameRef = useRef(null);

  const MINIMUM_BEAMS = 30;

  const opacityMap = {
    subtle: 0.6,
    medium: 0.8,
    strong: 1,
  };

  function createBeam(width, height) {
    const angle = -35 + Math.random() * 10;

    return {
      x: Math.random() * width * 1.5 - width * 0.25,
      y: Math.random() * height * 1.5 - height * 0.25,
      width: 30 + Math.random() * 60,
      length: height * 2.5,
      angle,
      speed: 0.6 + Math.random() * 1.2,
      opacity: 0.12 + Math.random() * 0.16,
      hue: 170 + Math.random() * 30, // slightly medical green range
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let running = true;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;

      // 🔥 Reset transform before resizing (CRITICAL FIX)
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.scale(dpr, dpr);

      // Recreate beams
      beamsRef.current = Array.from(
        { length: MINIMUM_BEAMS },
        () => createBeam(canvas.width, canvas.height)
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    function animate() {
      if (!running) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "blur(35px)";

      beamsRef.current.forEach((beam) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        if (beam.y + beam.length < -100) {
          beam.y = canvas.height + 100;
        }

        const pulsingOpacity =
          beam.opacity *
          (0.8 + Math.sin(beam.pulse) * 0.2) *
          opacityMap[intensity];

        const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
        gradient.addColorStop(0, `hsla(${beam.hue},85%,75%,0)`);
        gradient.addColorStop(
          0.5,
          `hsla(${beam.hue},85%,55%,${pulsingOpacity})`
        );
        gradient.addColorStop(1, `hsla(${beam.hue},85%,75%,0)`);

        ctx.save();
        ctx.translate(beam.x, beam.y);
        ctx.rotate((beam.angle * Math.PI) / 180);
        ctx.fillStyle = gradient;
        ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      running = false;
      window.removeEventListener("resize", updateCanvasSize);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [intensity]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
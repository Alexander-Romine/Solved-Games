import React, { useEffect, useRef } from 'react';

interface SketchDoodle {
  x: number;
  y: number;
  type: 'arrow' | 'cross' | 'curly' | 'circle' | 'tally';
  size: number;
  rotation: number;
  alpha: number;
}

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      drawDesk();
    };

    // Pre-generate background pencil doodles
    const doodles: SketchDoodle[] = [];
    const count = Math.min(30, Math.floor((width * height) / 35000));
    const types: SketchDoodle['type'][] = ['arrow', 'cross', 'curly', 'circle', 'tally'];

    for (let i = 0; i < count; i++) {
      doodles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        type: types[Math.floor(Math.random() * types.length)],
        size: Math.random() * 18 + 14,
        rotation: (Math.random() - 0.5) * 0.8,
        alpha: Math.random() * 0.08 + 0.04,
      });
    }

    const drawDesk = () => {
      ctx.clearRect(0, 0, width, height);

      // Warm wooden craft-desk background gradient
      const woodGrad = ctx.createLinearGradient(0, 0, width, height);
      woodGrad.addColorStop(0, '#2d2620');
      woodGrad.addColorStop(0.5, '#26201a');
      woodGrad.addColorStop(1, '#1f1a15');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle cutting-mat / graph grid overlay
      ctx.strokeStyle = 'rgba(215, 195, 165, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw faint etched doodles across the desk
      for (const d of doodles) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.strokeStyle = `rgba(220, 205, 180, ${d.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';

        if (d.type === 'cross') {
          ctx.beginPath();
          ctx.moveTo(-d.size / 2, 0);
          ctx.lineTo(d.size / 2, 0);
          ctx.moveTo(0, -d.size / 2);
          ctx.lineTo(0, d.size / 2);
          ctx.stroke();
        } else if (d.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, d.size / 2, 0, Math.PI * 1.85); // slightly incomplete hand-drawn circle
          ctx.stroke();
        } else if (d.type === 'curly') {
          ctx.beginPath();
          ctx.moveTo(-d.size / 2, 0);
          ctx.bezierCurveTo(-d.size / 4, -d.size / 2, d.size / 4, d.size / 2, d.size / 2, 0);
          ctx.stroke();
        } else if (d.type === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(-d.size / 2, 0);
          ctx.lineTo(d.size / 2, 0);
          ctx.lineTo(d.size / 4, -d.size / 3);
          ctx.moveTo(d.size / 2, 0);
          ctx.lineTo(d.size / 4, d.size / 3);
          ctx.stroke();
        } else if (d.type === 'tally') {
          ctx.beginPath();
          ctx.moveTo(-6, -d.size / 2);
          ctx.lineTo(-6, d.size / 2);
          ctx.moveTo(-2, -d.size / 2);
          ctx.lineTo(-2, d.size / 2);
          ctx.moveTo(2, -d.size / 2);
          ctx.lineTo(2, d.size / 2);
          ctx.moveTo(6, -d.size / 2);
          ctx.lineTo(6, d.size / 2);
          ctx.moveTo(-8, d.size / 3);
          ctx.lineTo(8, -d.size / 3); // strike
          ctx.stroke();
        }

        ctx.restore();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      aria-hidden="true"
    />
  );
};

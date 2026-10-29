import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  shape: 'dot' | 'cross' | 'ring' | 'diamond';
  size: number;
  rotation: number;
  vRot: number;
}

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for subtle interactive gravity/glow
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize particles: doubled count as requested for richer ambient atmosphere
    const isMobile = width < 768;
    const particleCount = isMobile ? 50 : 88;
    const particles: Particle[] = [];

    const shapes: ('dot' | 'cross' | 'ring' | 'diamond')[] = [
      'dot', 'dot', 'dot', 'dot',
      'cross', 'ring', 'diamond'
    ];

    for (let i = 0; i < particleCount; i++) {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.15 - Math.random() * 0.25, // Gentle upward drifting like ambient embers/nodes
        radius: Math.random() * 1.5 + 0.7,
        baseAlpha: Math.random() * 0.20 + 0.08,
        alpha: 0.16,
        pulseSpeed: Math.random() * 0.02 + 0.008,
        pulsePhase: Math.random() * Math.PI * 2,
        shape,
        size: shape === 'dot' ? 2 : Math.random() * 2.8 + 2.8,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.01,
      });
    }

    let time = 0;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 1;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Deeper, darker atmospheric background gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        width * 0.05,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7
      );
      bgGrad.addColorStop(0, '#050508');
      bgGrad.addColorStop(0.35, '#020203');
      bgGrad.addColorStop(0.75, '#000000');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient cursor glow if inside window
      if (mouse.x > 0 && mouse.y > 0) {
        const cursorGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          220
        );
        cursorGlow.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
        cursorGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw faint game-tree constellation lines between nearby nodes
      const maxDistance = isMobile ? 85 : 120;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.08 * Math.min(p1.alpha, p2.alpha);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Update and draw each particle
      for (const p of particles) {
        // Floating motion with gentle horizontal oscillation
        p.pulsePhase += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.08;
        p.rotation += p.vRot;

        p.x += p.vx + Math.sin(p.pulsePhase * 0.5) * 0.15;
        p.y += p.vy;

        // Subtle mouse repulsion
        if (mouse.x > 0 && mouse.y > 0) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mDist = Math.hypot(mdx, mdy);
          if (mDist < 140 && mDist > 0) {
            const force = (1 - mDist / 140) * 0.8;
            p.x += (mdx / mDist) * force;
            p.y += (mdy / mDist) * force;
          }
        }

        // Screen wrap
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'dot') {
          // Circular node with faint halo
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.fill();

          // Subtle glow ring
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.12})`;
          ctx.fill();
        } else if (p.shape === 'cross') {
          // Subtle game matrix '+' marker
          const s = p.size;
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.85})`;
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.moveTo(-s, 0);
          ctx.lineTo(s, 0);
          ctx.moveTo(0, -s);
          ctx.lineTo(0, s);
          ctx.stroke();
        } else if (p.shape === 'ring') {
          // Subtle hollow disc token
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.75})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.shape === 'diamond') {
          // Subtle decision wireframe diamond
          const s = p.size;
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.7})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s, 0);
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      style={{
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
      aria-hidden="true"
    />
  );
};

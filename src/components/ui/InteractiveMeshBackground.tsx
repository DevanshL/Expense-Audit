import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function InteractiveMeshBackground({ forceDark }: { forceDark?: boolean } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const scaleCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);

    // Initialize nodes
    const nodeCount = Math.min(Math.floor((width * height) / 14000), 80);
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35, // subtle drifting velocity
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 1,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const isDarkMode = () => document.documentElement.classList.contains('dark');

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const dark = forceDark || isDarkMode();
      const nodeColor = dark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(99, 102, 241, 0.25)';

      // Update and draw nodes
      nodes.forEach((node) => {
        // Drifting motion
        node.x += node.vx;
        node.y += node.vy;

        // Bounce on boundaries
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Mouse attraction/repulsion logic
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - node.x;
          const dy = mouseRef.current.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const forceRadius = 150;

          if (dist < forceRadius) {
            // Soft attraction force towards cursor
            const force = (forceRadius - dist) / forceRadius;
            node.x += (dx / dist) * force * 0.4;
            node.y += (dy / dist) * force * 0.4;
          }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
      });

      // Draw connections
      const connectionDist = 120;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            const opacity = (1 - dist / connectionDist) * (dark ? 0.12 : 0.08);
            ctx.strokeStyle = dark ? `rgba(129, 140, 248, ${opacity})` : `rgba(99, 102, 241, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw mouse node links
      if (mouseRef.current.active) {
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;
        const mouseLinkDist = 160;

        nodes.forEach((node) => {
          const dx = node.x - mouseX;
          const dy = node.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseLinkDist) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouseX, mouseY);
            const opacity = (1 - dist / mouseLinkDist) * (dark ? 0.25 : 0.15);
            ctx.strokeStyle = dark ? `rgba(129, 140, 248, ${opacity})` : `rgba(99, 102, 241, ${opacity})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', scaleCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

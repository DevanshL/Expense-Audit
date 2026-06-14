import React, { useState, useRef } from 'react';
import type { MouseEvent } from 'react';
import { cn } from '../../utils/cn';

interface Interactive3DTiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number; // Maximum tilt angle in degrees
  perspective?: number; // Perspective value in pixels
  scale?: number; // Scale on hover
  glareOpacity?: number; // Maximum opacity of glare overlay
}

export function Interactive3DTiltCard({
  children,
  className,
  maxTilt = 8,
  perspective = 1000,
  scale = 1.02,
  glareOpacity = 0.35,
  ...props
}: Interactive3DTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position inside element
    const y = e.clientY - rect.top;  // y position inside element
    
    // Normalize coordinates from -0.5 to 0.5
    const normalizedX = (x / rect.width) - 0.5;
    const normalizedY = (y / rect.height) - 0.5;

    // Calculate rotation angles
    // Moving mouse to the right rotates around Y-axis positively
    // Moving mouse down rotates around X-axis negatively
    const tiltX = -normalizedY * maxTilt;
    const tiltY = normalizedX * maxTilt;

    setRotateX(tiltX);
    setRotateY(tiltY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const cardStyle: React.CSSProperties = {
    transform: isHovered
      ? `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
      : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: isHovered
      ? 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.25s ease'
      : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease',
    transformStyle: 'preserve-3d',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
      className={cn(
        "relative rounded-2xl overflow-hidden transition-shadow duration-300",
        isHovered
          ? "shadow-[0_30px_60px_rgba(79,70,229,0.25)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-indigo-500/30 dark:border-indigo-500/20"
          : "shadow-xl border border-transparent",
        className
      )}
      {...props}
    >
      {/* 3D Depth Layer */}
      <div 
        style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
        className="w-full h-full"
      >
        {children}
      </div>

      {/* Glossy Glare Reflection Layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 mix-blend-overlay"
        style={{
          opacity: isHovered ? glareOpacity : 0,
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%)`,
        }}
      />
    </div>
  );
}

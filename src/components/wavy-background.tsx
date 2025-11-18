'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = 'fast',
  waveOpacity = 0.5,
  ...props
}: {
  children?: any;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: 'slow' | 'fast';
  waveOpacity?: number;
  [key: string]: any;
}) => {
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(
      typeof window !== 'undefined' &&
        navigator.userAgent.includes('Safari') &&
        !navigator.userAgent.includes('Chrome')
    );
  }, []);

  const noise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getSpeed = () => {
    switch (speed) {
      case 'slow':
        return 0.001;
      case 'fast':
        return 0.002;
      default:
        return 0.001;
    }
  };

  const init = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let waveWidthValue = waveWidth || 50;
    let waveCount = Math.ceil(width / waveWidthValue) + 2;
    let waveHeight = height * 0.5;

    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step += getSpeed();

      for (let i = 0; i < waveCount; i++) {
        const angle = step + (i * Math.PI) / 5;
        const x = i * waveWidthValue - waveWidthValue;
        const y = height / 2 + Math.sin(angle) * waveHeight * 0.2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let j = 0; j < waveWidthValue; j++) {
          const nx = x + j;
          const ny = y + Math.sin(step + (nx * Math.PI) / (width / 2)) * waveHeight * 0.1;
          ctx.lineTo(nx, ny);
        }
        ctx.lineTo(x + waveWidthValue, height);
        ctx.lineTo(x, height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        const gradColors = colors || ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee'];
        const colorIndex = i % gradColors.length;
        gradient.addColorStop(0, gradColors[colorIndex]);
        gradient.addColorStop(0.5, gradColors[(colorIndex + 1) % gradColors.length]);

        ctx.fillStyle = gradient;
        ctx.globalAlpha = waveOpacity || 0.5;
        ctx.fill();
      }
      requestAnimationFrame(render);
    };
    render();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const resize = () => {
          const newWidth = canvas.parentElement?.offsetWidth || window.innerWidth;
          const newHeight = canvas.parentElement?.offsetHeight || window.innerHeight;
          canvas.width = newWidth;
          canvas.height = newHeight;
          setDimensions({ width: newWidth, height: newHeight });
          init(ctx, newWidth, newHeight);
        };
        window.addEventListener('resize', resize);
        resize();
        return () => window.removeEventListener('resize', resize);
      }
    }
  }, [colors, waveWidth, speed, waveOpacity]);


  return (
    <div
      className={cn(
        'h-screen flex flex-col items-center justify-center',
        containerClassName
      )}
    >
      <canvas
        className="absolute inset-0 z-0"
        ref={canvasRef}
        id="canvas"
      ></canvas>
      <div
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
        className={cn('absolute inset-0 z-0 bg-background/50', backgroundFill)}
      ></div>
      <div className={cn('relative z-10', className)} {...props}>
        {children}
      </div>
    </div>
  );
};

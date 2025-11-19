'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState, useCallback } from 'react';

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const mousePosition = useRef({ x: 0, y: 0 });

  const getSpeed = useCallback(() => {
    switch (speed) {
      case 'slow':
        return 0.001;
      case 'fast':
        return 0.002;
      default:
        return 0.001;
    }
  }, [speed]);

  const init = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let waveWidthValue = waveWidth || 50;
    let waveCount = Math.ceil(width / waveWidthValue) + 2;
    let waveHeight = height * 0.5;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step += getSpeed();

      for (let i = 0; i < waveCount; i++) {
        const angle = step + (i * Math.PI) / 5;
        // Introduce mouse interaction
        const mouseEffect = Math.sin(mousePosition.current.x / width * Math.PI * 2) * 0.1;
        const x = i * waveWidthValue - waveWidthValue;
        const y = height / 2 + Math.sin(angle) * (waveHeight * (0.2 + mouseEffect));

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

        const gradColors = colors || ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee'];
        const colorIndex = i % gradColors.length;
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, gradColors[colorIndex]);
        gradient.addColorStop(0.5, gradColors[(colorIndex + 1) % gradColors.length]);

        ctx.fillStyle = gradient;
        ctx.globalAlpha = waveOpacity || 0.5;
        ctx.fill();
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
  }, [colors, getSpeed, waveOpacity, waveWidth]);
  
  const handleMouseMove = (event: MouseEvent) => {
    mousePosition.current = { x: event.clientX, y: event.clientY };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const resize = () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          const newWidth = canvas.parentElement?.offsetWidth || window.innerWidth;
          const newHeight = canvas.parentElement?.offsetHeight || window.innerHeight;
          canvas.width = newWidth;
          canvas.height = newHeight;
          init(ctx, newWidth, newHeight);
        };
        
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        resize();
        
        return () => {
          window.removeEventListener('resize', resize);
          window.removeEventListener('mousemove', handleMouseMove);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
      }
    }
  }, [init]);


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

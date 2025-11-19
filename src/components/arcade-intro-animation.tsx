
'use client';

import { Gamepad2, Ghost, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = [
  { icon: <Ghost className="w-8 h-8 text-pink-500" />, style: 'animate-float-1' },
  { icon: <Gamepad2 className="w-8 h-8 text-cyan-400" />, style: 'animate-float-2' },
  { icon: <Bot className="w-8 h-8 text-lime-400" />, style: 'animate-float-3' },
  { icon: <Ghost className="w-8 h-8 text-orange-500" />, style: 'animate-float-4' },
  { icon: <Gamepad2 className="w-8 h-8 text-yellow-400" />, style: 'animate-float-1' },
  { icon: <Bot className="w-8 h-8 text-purple-500" />, style: 'animate-float-2' },
];

const ShooterPlane = () => (
    <div className="relative w-8 h-8 text-red-500">
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="absolute w-full h-full transform -rotate-90"
        >
            <path d="M12 2L2 22h20L12 2z" />
        </svg>
        <div className="absolute w-1 h-3 bg-yellow-400 rounded-full top-[-15px] left-1/2 -translate-x-1/2 animate-shoot" />
    </div>
);


export function ArcadeIntroAnimation() {
  return (
    <div className="relative w-full h-24 overflow-hidden">
      {icons.map((item, index) => (
        <div
          key={index}
          className={cn(
            'absolute',
            item.style
          )}
          style={{
            left: `${10 + index * 15}%`,
            animationDelay: `${index * 0.5}s`,
          }}
        >
          {item.icon}
        </div>
      ))}
      <div className="absolute top-0 left-0 animate-fly-past" style={{ animationDelay: '1s' }}>
          <ShooterPlane />
      </div>
    </div>
  );
}

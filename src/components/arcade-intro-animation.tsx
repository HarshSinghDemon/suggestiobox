
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

export function ArcadeIntroAnimation() {
  return (
    <div className="relative w-full h-24">
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
    </div>
  );
}

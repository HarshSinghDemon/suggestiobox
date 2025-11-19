
'use client';

import { Gamepad2, Ghost, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const initialIcons = [
  { id: 1, icon: <Ghost className="w-8 h-8 text-pink-500" />, style: 'animate-float-1', popped: false, popDelay: '1.8s' },
  { id: 2, icon: <Gamepad2 className="w-8 h-8 text-cyan-400" />, style: 'animate-float-2', popped: false, popDelay: '2.2s' },
  { id: 3, icon: <Bot className="w-8 h-8 text-lime-400" />, style: 'animate-float-3', popped: false, popDelay: '2.6s' },
  { id: 4, icon: <Ghost className="w-8 h-8 text-orange-500" />, style: 'animate-float-4', popped: false, popDelay: '3.0s' },
  { id: 5, icon: <Gamepad2 className="w-8 h-8 text-yellow-400" />, style: 'animate-float-1', popped: false, popDelay: '3.4s' },
  { id: 6, icon: <Bot className="w-8 h-8 text-purple-500" />, style: 'animate-float-2', popped: false, popDelay: '3.8s' },
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
    const [icons, setIcons] = useState(initialIcons);

    useEffect(() => {
        const timers = icons.map(icon => 
            setTimeout(() => {
                setIcons(prevIcons => 
                    prevIcons.map(i => i.id === icon.id ? { ...i, popped: true } : i)
                );
            }, parseFloat(icon.popDelay) * 1000)
        );

        // Reset animation for continuous looping effect if needed
        const animationDuration = 6000; // Corresponds to fly-past duration + buffer
        const interval = setInterval(() => {
            setIcons(initialIcons.map(i => ({...i, popped: false})));
        }, animationDuration);

        return () => {
            timers.forEach(clearTimeout);
            clearInterval(interval);
        };
    }, []);

  return (
    <div className="relative w-full h-24 overflow-hidden">
      {icons.map((item) => (
        <div
          key={item.id}
          className={cn(
            'absolute transition-opacity duration-300',
            item.style,
            item.popped && 'animate-pop'
          )}
          style={{
            left: `${10 + (item.id -1) * 15}%`,
            animationDelay: `${(item.id -1) * 0.2}s`,
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

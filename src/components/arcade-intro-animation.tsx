
'use client';

import { Gamepad2, Ghost, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';

const initialIcons = [
  { id: 1, icon: <Ghost className="w-8 h-8 text-pink-500" />, style: 'animate-float-1', popped: false, popDelay: 1800 },
  { id: 2, icon: <Gamepad2 className="w-8 h-8 text-cyan-400" />, style: 'animate-float-2', popped: false, popDelay: 2200 },
  { id: 3, icon: <Bot className="w-8 h-8 text-lime-400" />, style: 'animate-float-3', popped: false, popDelay: 2600 },
  { id: 4, icon: <Ghost className="w-8 h-8 text-orange-500" />, style: 'animate-float-4', popped: false, popDelay: 3000 },
  { id: 5, icon: <Gamepad2 className="w-8 h-8 text-yellow-400" />, style: 'animate-float-1', popped: false, popDelay: 3400 },
  { id: 6, icon: <Bot className="w-8 h-8 text-purple-500" />, style: 'animate-float-2', popped: false, popDelay: 3800 },
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
    const [animationKey, setAnimationKey] = useState(0);

    const runAnimationCycle = useCallback(() => {
        // Reset icons to their initial state (not popped)
        setIcons(initialIcons.map(i => ({ ...i, popped: false })));

        // Schedule the "pop" for each icon
        const timers = initialIcons.map(icon =>
            setTimeout(() => {
                setIcons(prevIcons =>
                    prevIcons.map(i => (i.id === icon.id ? { ...i, popped: true } : i))
                );
            }, icon.popDelay)
        );
        
        // This key change will force the shooter plane animation to restart
        setAnimationKey(prevKey => prevKey + 1);

        return () => {
            timers.forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        // Run the first cycle immediately
        const cleanupFirstRun = runAnimationCycle();

        // Set an interval to run subsequent cycles
        const animationDuration = 6000; // Corresponds to fly-past duration + buffer
        const interval = setInterval(runAnimationCycle, animationDuration);

        return () => {
            cleanupFirstRun();
            clearInterval(interval);
        };
    }, [runAnimationCycle]);

  return (
    <div className="relative w-full h-24">
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
      <div key={animationKey} className="absolute top-0 left-0 animate-fly-past">
          <ShooterPlane />
      </div>
    </div>
  );
}

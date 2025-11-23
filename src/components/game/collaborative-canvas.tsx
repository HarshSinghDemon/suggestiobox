'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Brush } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';

const colors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F8FAFC', '#18181B'];

export function CollaborativeCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#F8FAFC');
    const [brushSize, setBrushSize] = useState(5);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = 500; // Fixed height
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        const context = canvas.getContext('2d');
        if (context) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            contextRef.current = context;
        }

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    useEffect(() => {
        if(contextRef.current) {
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = brushSize;
        }
    }, [color, brushSize]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    const getCoordinates = (event: MouseEvent | TouchEvent) => {
        if (event instanceof MouseEvent) {
            return { offsetX: event.offsetX, offsetY: event.offsetY };
        }
        if (event.touches && event.touches.length > 0) {
            const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
            return {
                offsetX: event.touches[0].clientX - rect.left,
                offsetY: event.touches[0].clientY - rect.top,
            };
        }
        return { offsetX: 0, offsetY: 0 };
    };
    
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        startDrawing({ nativeEvent: e.nativeEvent });
    }
    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        draw({ nativeEvent: e.nativeEvent });
    }


    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas && contextRef.current) {
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col md:flex-row items-center w-full gap-4 p-2 border rounded-lg bg-muted">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {colors.map((c) => (
                        <button
                            key={c}
                            style={{ backgroundColor: c }}
                            className={cn(
                                "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                                color === c ? 'border-primary' : 'border-muted-foreground/50'
                            )}
                            onClick={() => setColor(c)}
                        />
                    ))}
                </div>
                <div className="flex items-center w-full gap-2 md:w-auto">
                    <Brush className="w-5 h-5"/>
                    <Slider 
                        defaultValue={[brushSize]}
                        max={20}
                        min={1}
                        step={1}
                        onValueChange={(value) => setBrushSize(value[0])}
                        className="w-full md:w-32"
                    />
                </div>
                <Button onClick={clearCanvas} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear
                </Button>
            </div>
            <canvas
                ref={canvasRef}
                className="bg-card-foreground/5 rounded-md cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                onTouchStart={handleTouchStart}
                onTouchEnd={finishDrawing}
                onTouchMove={handleTouchMove}
            />
        </div>
    );
}

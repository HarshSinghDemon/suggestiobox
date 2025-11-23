'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Brush, Timer, MessageSquare, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';

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
                canvas.height = 450; // Fixed height
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
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };
        
        if (event instanceof MouseEvent) {
            return { offsetX: event.offsetX, offsetY: event.offsetY };
        }
        if (event.touches && event.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className='md:col-span-3'>
                <div className='w-full p-2 mb-2 text-center border rounded-lg bg-muted'>
                    <p className='text-sm text-muted-foreground'>You are drawing:</p>
                    <p className='text-xl font-bold tracking-widest uppercase'>CONCEPT</p>
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
            <div className="flex flex-col gap-4">
                 <Card>
                    <CardContent className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className='font-semibold'>Time</h4>
                            <div className='flex items-center gap-2 font-mono font-bold text-primary'><Timer className='w-5 h-5' /> <span>60</span></div>
                        </div>
                         <div className="flex flex-col gap-2">
                             <h4 className='font-semibold'>Brush</h4>
                            <div className="flex items-center w-full gap-2">
                                <Brush className="w-5 h-5"/>
                                <Slider 
                                    defaultValue={[brushSize]}
                                    max={20}
                                    min={1}
                                    step={1}
                                    onValueChange={(value) => setBrushSize(value[0])}
                                    className="w-full"
                                />
                            </div>
                         </div>
                          <div className="flex flex-col gap-2">
                             <h4 className='font-semibold'>Color</h4>
                             <div className="grid grid-cols-6 gap-1">
                                {colors.map((c) => (
                                    <button
                                        key={c}
                                        style={{ backgroundColor: c }}
                                        className={cn(
                                            "w-full aspect-square rounded-md border-2 transition-transform hover:scale-110",
                                            color === c ? 'border-primary' : 'border-muted-foreground/50'
                                        )}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                         </div>
                         <Button onClick={clearCanvas} variant="outline" size="sm" className='w-full'>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear Canvas
                        </Button>
                    </CardContent>
                </Card>
                <Card className="flex flex-col flex-grow">
                     <CardContent className="flex flex-col flex-grow p-3">
                        <h4 className='flex items-center gap-2 mb-2 font-semibold'><MessageSquare className='w-5 h-5' /> Guesses</h4>
                        <div className='flex-grow p-2 rounded-md bg-muted/50'>
                            <p className='text-sm text-muted-foreground italic'>Chat messages will appear here...</p>
                        </div>
                        <div className='flex gap-2 mt-2'>
                            <Input placeholder='Type your guess...' className='h-9' />
                            <Button size="sm">Guess</Button>
                        </div>
                     </CardContent>
                </Card>
            </div>
        </div>
    );
}

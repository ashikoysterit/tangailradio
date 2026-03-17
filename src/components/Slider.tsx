import React, { useState, useEffect } from 'react';
import { fetchSlider } from '@/db/api';
import { SliderImage } from '../types/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export const Slider: React.FC = () => {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchSlider().then(setImages).catch(console.error);
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images]);

  if (images.length === 0) return null;

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative w-full aspect-[2/1] md:aspect-[21/9] overflow-hidden rounded-[2rem] bg-muted shadow-2xl group border border-primary/5">
      <div 
        className="flex transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img) => (
          <div key={img.id} className="min-w-full h-full relative">
            <img 
              src={img.image_url} 
              alt={img.title || 'Slider'} 
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12">
              {img.title && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="max-w-2xl"
                >
                  <h2 className="text-xl md:text-4xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tighter">
                    {img.title}
                  </h2>
                  <div className="h-1 w-20 bg-primary mt-4 rounded-full" />
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <Button 
          variant="outline" 
          size="icon" 
          className="w-12 h-12 bg-white/10 backdrop-blur-md border-white/20 text-white rounded-full pointer-events-auto hover:bg-white/20"
          onClick={prev}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="w-12 h-12 bg-white/10 backdrop-blur-md border-white/20 text-white rounded-full pointer-events-auto hover:bg-white/20"
          onClick={next}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-primary w-8' : 'bg-white/30 w-3 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

interface BreakingNewsSlide {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category?: { name: string; color: string };
}

interface BreakingNewsCarouselProps {
  slides: BreakingNewsSlide[];
  autoPlayInterval?: number;
}

export default function BreakingNewsCarousel({ slides, autoPlayInterval = 5000 }: BreakingNewsCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure we have exactly 6 slides or less (display what we have)
  const displaySlides = slides.slice(0, 6);
  const slideCount = displaySlides.length;

  if (slideCount === 0) return null;

  const goToSlide = (index: number) => {
    setCurrentSlide(index % slideCount);
    setIsAutoPlaying(false);
    
    // Resume autoplay after 8 seconds of user interaction
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    autoPlayTimeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 8000);
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, slideCount, autoPlayInterval]);

  return (
    <div ref={containerRef} className="relative w-full bg-gradient-to-br from-red-700 to-red-800 rounded-lg overflow-hidden shadow-lg">
      {/* Carousel Container */}
      <div className="relative aspect-video sm:aspect-auto h-64 sm:h-80 md:h-96 overflow-hidden">
        {/* Slides */}
        {displaySlides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <Link
              key={slide.id}
              href={`/article/${slide.slug}`}
              className={`absolute inset-0 transition-all duration-700 ease-in-out cursor-pointer group ${
                isActive
                  ? "opacity-100 scale-100"
                  : index < currentSlide
                    ? "opacity-0 -translate-x-full scale-95"
                    : "opacity-0 translate-x-full scale-95"
              }`}
            >
              {/* Background Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8 z-20">
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full font-sans uppercase tracking-wider shadow-lg">
                    <Flame size={12} /> Breaking
                  </span>
                  {slide.category && (
                    <span
                      className="text-white text-xs font-bold px-2 py-1 rounded font-sans uppercase tracking-wide"
                      style={{ backgroundColor: slide.category.color }}
                    >
                      {slide.category.name}
                    </span>
                  )}
                </div>

                {/* Title - Only visible at bottom on small screens */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h2
                    className="text-white font-bold text-lg sm:text-xl md:text-2xl leading-tight line-clamp-3"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {slide.title}
                  </h2>
                  <p className="text-red-100 text-sm sm:text-base mt-2 line-clamp-2 hidden sm:block">{slide.excerpt}</p>
                </div>
              </div>

              {/* Mobile Title at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:hidden bg-gradient-to-t from-black to-transparent">
                <h3 className="text-white font-bold text-sm leading-tight line-clamp-2" style={{ fontFamily: "Georgia, serif" }}>
                  {slide.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 rounded-full transition-all duration-200 backdrop-blur-sm group"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
      </button>

      <button
        onClick={nextSlide}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 rounded-full transition-all duration-200 backdrop-blur-sm group"
        aria-label="Next slide"
      >
        <ChevronRight size={20} className="sm:w-6 sm:h-6" />
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 sm:gap-2">
        {displaySlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide ? "bg-white w-2 h-2 sm:w-3 sm:h-3" : "bg-white/50 hover:bg-white/70 w-1.5 h-1.5 sm:w-2 sm:h-2"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 z-30 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-sans backdrop-blur-sm">
        {currentSlide + 1} / {slideCount}
      </div>
    </div>
  );
}

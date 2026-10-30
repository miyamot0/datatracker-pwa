import * as React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AUTOPLAY_INTERVAL = 3000; // ms

type CarouselOptions = {
  loop?: boolean;
  autoplay?: boolean;
};

type CarouselProps = {
  opts?: CarouselOptions;
  orientation?: 'horizontal' | 'vertical';
};

type CarouselContextProps = {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  orientation: 'horizontal' | 'vertical';
  selectedIndex: number;
  count: number;
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}

// Slides are scroll-snap children of the viewport; the active index is derived from scroll position.
function slidesOf(viewport: HTMLDivElement | null): HTMLElement[] {
  return viewport ? (Array.from(viewport.children) as HTMLElement[]) : [];
}

const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CarouselProps>(
  ({ orientation = 'horizontal', opts, className, children, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
    const loop = opts?.loop ?? false;
    const autoplayEnabled = opts?.autoplay ?? true;
    const viewportRef = React.useRef<HTMLDivElement | null>(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [count, setCount] = React.useState(0);
    const [paused, setPaused] = React.useState(false);
    const [reducedMotion, setReducedMotion] = React.useState(false);

    React.useEffect(() => {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
      const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }, []);

    const scrollTo = React.useCallback(
      (index: number) => {
        const viewport = viewportRef.current;
        const slide = slidesOf(viewport)[index];
        if (!viewport || !slide) {
          return;
        }
        const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';
        if (orientation === 'horizontal') {
          viewport.scrollTo({ left: slide.offsetLeft, behavior });
        } else {
          viewport.scrollTo({ top: slide.offsetTop, behavior });
        }
      },
      [orientation, reducedMotion]
    );

    const scrollPrev = React.useCallback(() => {
      if (selectedIndex === 0) {
        if (loop) scrollTo(count - 1);
        return;
      }
      scrollTo(selectedIndex - 1);
    }, [count, loop, scrollTo, selectedIndex]);

    const scrollNext = React.useCallback(() => {
      if (selectedIndex >= count - 1) {
        if (loop) scrollTo(0);
        return;
      }
      scrollTo(selectedIndex + 1);
    }, [count, loop, scrollTo, selectedIndex]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext]
    );

    // Track the active slide (and slide count) from the viewport's scroll position.
    React.useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }
      const update = () => {
        const slides = slidesOf(viewport);
        setCount(slides.length);
        const horizontal = orientation === 'horizontal';
        const pos = horizontal ? viewport.scrollLeft : viewport.scrollTop;
        let nearest = 0;
        let best = Infinity;
        slides.forEach((slide, i) => {
          const distance = Math.abs((horizontal ? slide.offsetLeft : slide.offsetTop) - pos);
          if (distance < best) {
            best = distance;
            nearest = i;
          }
        });
        setSelectedIndex(nearest);
      };
      update();
      viewport.addEventListener('scroll', update, { passive: true });
      const resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(viewport);
      return () => {
        viewport.removeEventListener('scroll', update);
        resizeObserver.disconnect();
      };
    }, [orientation, children]);

    // Autoplay advances every few seconds and pauses on hover, focus, or reduced motion.
    const autoplayActive = autoplayEnabled && !paused && !reducedMotion && count > 1;
    React.useEffect(() => {
      if (!autoplayActive) {
        return;
      }
      const intervalId = setInterval(() => {
        scrollTo(selectedIndex >= count - 1 ? 0 : selectedIndex + 1);
      }, AUTOPLAY_INTERVAL);
      return () => clearInterval(intervalId);
    }, [autoplayActive, count, scrollTo, selectedIndex]);

    return (
      <CarouselContext.Provider
        value={{
          viewportRef,
          orientation,
          selectedIndex,
          count,
          scrollTo,
          scrollPrev,
          scrollNext,
          canScrollPrev: loop ? count > 1 : selectedIndex > 0,
          canScrollNext: loop ? count > 1 : selectedIndex < count - 1,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          onMouseEnter={(e) => {
            setPaused(true);
            onMouseEnter?.(e);
          }}
          onMouseLeave={(e) => {
            setPaused(false);
            onMouseLeave?.(e);
          }}
          onFocus={(e) => {
            setPaused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setPaused(false);
            }
            onBlur?.(e);
          }}
          className={cn('relative', className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = 'Carousel';

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { viewportRef, orientation } = useCarousel();

    return (
      <div
        ref={(node) => {
          viewportRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          orientation === 'vertical' && 'flex-col overflow-x-hidden overflow-y-auto snap-y',
          className
        )}
        {...props}
      />
    );
  }
);
CarouselContent.displayName = 'CarouselContent';

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          'min-w-0 shrink-0 grow-0 basis-full',
          orientation === 'horizontal' ? 'snap-center' : 'snap-start',
          className
        )}
        {...props}
      />
    );
  }
);
CarouselItem.displayName = 'CarouselItem';

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? '-left-12 top-1/2 -translate-y-1/2'
            : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
          className
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    );
  }
);
CarouselPrevious.displayName = 'CarouselPrevious';

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? '-right-12 top-1/2 -translate-y-1/2'
            : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
          className
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  }
);
CarouselNext.displayName = 'CarouselNext';

const CarouselDots = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { count, selectedIndex, scrollTo } = useCarousel();

    return (
      <div ref={ref} className={cn('flex justify-center gap-2 pt-4', className)} {...props}>
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === selectedIndex ? 'true' : undefined}
            onClick={() => scrollTo(index)}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              index === selectedIndex ? 'bg-foreground' : 'bg-muted-foreground/40 hover:bg-muted-foreground'
            )}
          />
        ))}
      </div>
    );
  }
);
CarouselDots.displayName = 'CarouselDots';

export { type CarouselOptions, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselDots };

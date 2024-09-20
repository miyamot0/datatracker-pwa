import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import img_chains from '@/assets/img/concurrent_chains.svg';
import img_integrity from '@/assets/img/fa_integrity.svg';
import img_standard from '@/assets/img/fa_standard.svg';
import img_schedule from '@/assets/img/fct_multiple_schedule.svg';
import img_reversal from '@/assets/img/fct_reversal.svg';
import img_baseline from '@/assets/img/multiple_baseline.svg';

const IMAGES = [img_chains, img_integrity, img_standard, img_schedule, img_reversal, img_baseline];

export default function ImageCarousel() {
  return (
    <div className="max-w-lg">
      <Carousel
        opts={{
          align: 'center',
          loop: true,
          axis: 'x',
          containScroll: 'keepSnaps',
          skipSnaps: true,
        }}
      >
        <CarouselContent>
          {IMAGES.map((img, index) => (
            <CarouselItem key={index} className="w-full flex flex-row justify-center items-center shadow-xl">
              <img src={img} alt="Preview of figure" loading="lazy" className="p-4 border rounded bg-white" />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="shadow-xl" />
        <CarouselNext className="shadow-xl" />
      </Carousel>
    </div>
  );
}

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const IMAGES_REMOTE = [
  'concurrent_chains.svg',
  'fa_integrity.svg',
  'fa_standard.svg',
  'fct_multiple_schedule.svg',
  'fct_reversal.svg',
  'multiple_baseline.svg',
].map((img) => `/img/${img}`);

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
          {IMAGES_REMOTE.map((img, index) => (
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

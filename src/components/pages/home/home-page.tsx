import { Button } from '@/components/ui/button';
import { BookTextIcon, ChartLineIcon, PackageIcon } from 'lucide-react';
import PageWrapper from '@/components/layout/page-wrapper';
import createHref from '@/lib/links';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';

import img_chains from '@/assets/img/concurrent_chains.svg';
import img_integrity from '@/assets/img/fa_integrity.svg';
import img_standard from '@/assets/img/fa_standard.svg';
import img_schedule from '@/assets/img/fct_multiple_schedule.svg';
import img_reversal from '@/assets/img/fct_reversal.svg';
import img_baseline from '@/assets/img/multiple_baseline.svg';

const IMAGES = [img_chains, img_integrity, img_standard, img_schedule, img_reversal, img_baseline];

export default function HomePage() {
  //const install = usePWAInstall();

  return (
    <PageWrapper className="flex flex-col gap-6">
      <div className="pb-4">
        <div className="text-center mx-auto">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">DataTracker</h1>
        </div>

        <div className="mt-1 text-center">
          <p className="text-xl text-muted-foreground">Electronic Data Collection Program</p>
        </div>
      </div>

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
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <div className="max-w-lg flex flex-col w-full py-8 gap-4">
        <Button variant={'outline'} className="w-full shadow-xl">
          <BookTextIcon className="mr-2 h-4 w-4" />
          <Link to={createHref({ type: 'Documentation' })}>Documentation</Link>
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant={'outline'} className="w-full shadow-xl">
              <PackageIcon className="h-4 w-4 mr-2" />
              Software Licenses
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-screen-md">
            <DialogHeader>
              <DialogTitle>Open Source Software</DialogTitle>
              <DialogDescription>Licensing information for relevant software is provided below</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[200px] w-full rounded-md pr-4">
              <p>...</p>
              {/*
{licenseInformation.map((entry, index) => {
                return (
                  <div
                    key={index}
                    className={cn('flex flex-row justify-between items-center', {
                      'mt-4': index > 0,
                    })}
                  >
                    <span>
                      <span className="font-bold">{`${entry.name}`}</span>
                      <span className="">{` (v${entry.installedVersion})`}</span>
                      <br />
                      <span className="text-sm text-muted-foreground">{`${entry.licenseType} Licensed`}</span>
                    </span>
                    <Link
                      href={entry.link.replace('git+', '')}
                      target="_blank"
                      className="text-blue-500 hover:underline hover:text-blue-600"
                    >
                      Repo
                    </Link>
                  </div>
                );
              })}
*/}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Button className="w-full shadow-xl">
          <ChartLineIcon className="mr-2 h-4 w-4" />
          <Link to={createHref({ type: 'Dashboard' })}>Load Application</Link>
        </Button>

        {/*
{install && (
          <Button className="w-full shadow-xl" variant={'default'} onClick={install}>
            <HardDriveDownloadIcon className="mr-2 h-4 w-4" />
            Install Application
          </Button>
        )}
*/}
      </div>
    </PageWrapper>
  );
}

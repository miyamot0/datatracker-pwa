import { Button } from '@/components/ui/button';
import { BookTextIcon, ChartLineIcon, HardDriveDownloadIcon, PackageIcon } from 'lucide-react';
import PageWrapper from '@/components/layout/page-wrapper';
import createHref from '@/lib/links';
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
import licenseInformation from '@/assets/licenses.json';
import { cn } from '@/lib/utils';
import { usePWAInstall } from 'react-use-pwa-install';
import { useEffect, useState } from 'react';
import { isOnMobilePlatform } from '@/lib/user-agent';
import ImageCarousel from './views/img-carousel';

export default function HomePage() {
  const install = usePWAInstall();
  const [display, setDisplay] = useState<'loading' | 'desktop' | 'mobile'>('loading');

  useEffect(() => {
    setDisplay(isOnMobilePlatform() === true ? 'mobile' : 'desktop');
  }, []);

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

      <ImageCarousel />

      <div className="max-w-lg flex flex-col w-full py-8 gap-4">
        <Link to={createHref({ type: 'Documentation' })} className="flex flex-row" unstable_viewTransition>
          <Button variant={'outline'} className="w-full shadow-xl">
            <BookTextIcon className="mr-2 h-4 w-4" />
            Documentation
          </Button>
        </Link>

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
            <ScrollArea className="h-[200px] w-full rounded-md pr-4 flex flex-col">
              {licenseInformation.map((entry, index) => {
                return (
                  <div
                    key={index}
                    className={cn('flex flex-row justify-between items-center', {
                      'mt-4 border-t pt-4': index > 0,
                    })}
                  >
                    <span>
                      <span className="font-bold">{`${entry.name}`}</span>
                      <span className="">{` (v${entry.installedVersion})`}</span>
                      <br />
                      <span className="text-sm text-muted-foreground">{`${entry.licenseType} Licensed`}</span>
                    </span>
                    <Link
                      to={entry.link.replace('git+', '')}
                      target="_blank"
                      className="text-blue-500 hover:underline hover:text-blue-600"
                    >
                      Link to Repository
                    </Link>
                  </div>
                );
              })}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {display === 'desktop' && (
          <Link to={createHref({ type: 'Dashboard' })} className="flex flex-row" unstable_viewTransition>
            <Button variant={'outline'} className="w-full shadow-xl">
              <ChartLineIcon className="mr-2 h-4 w-4" />
              Load Application
            </Button>
          </Link>
        )}

        {display === 'mobile' && (
          <p className="text-center text-red-500">DataTracker is Currently Unsupported on Mobile</p>
        )}

        {display === 'desktop' && install && (
          <Button className="w-full shadow-xl" variant={'outline'} onClick={install}>
            <HardDriveDownloadIcon className="mr-2 h-4 w-4" />
            Install Application
          </Button>
        )}

        <Link to={'/dashboard/sync'} className="flex flex-row" unstable_viewTransition>
          <Button variant={'outline'} className="w-full shadow-xl">
            <ChartLineIcon className="mr-2 h-4 w-4" />
            Sync (Beta)
          </Button>
        </Link>
      </div>
    </PageWrapper>
  );
}

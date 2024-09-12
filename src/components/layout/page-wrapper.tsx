import { cn } from '@/lib/utils';
import NavigationBar, { BreadCrumbListing } from './views/navigation-bar';
import package_json from '../../../package.json';
import build_date from '@/assets/build_date.json';
import { GithubIcon, HomeIcon, TwitterIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
  breadcrumbs?: BreadCrumbListing[];
  label?: string;
  className?: string;
};

export default function PageWrapper({ children, className, breadcrumbs, label }: Props) {
  return (
    <main
      className={cn('flex min-h-screen flex-col items-center w-full py-4 mx-2 max-w-screen-xl self-center', className)}
    >
      <NavigationBar breadcrumbs={breadcrumbs} label={label} />
      {children}

      <footer className="text-center text-sm text-gray-500 my-4 flex flex-col gap-4 select-none">
        <div>
          <Link
            to={`https://github.com/miyamot0/data-tracker-web`}
            className="text-blue-600 hover:text-blue-500"
            target="_blank"
          >
            DataTracker (PWA)
          </Link>{' '}
          is FOSS developed by{' '}
          <Link to={'https://www.smallnstats.com'} className="text-blue-600 hover:text-blue-500" target="_blank">
            Shawn Gilroy
          </Link>{' '}
          @ Louisiana State University
        </div>
        <div className="font-semibold">{`Build Version ${package_json.version} (${build_date.date})`}</div>
        <div className="flex flex-row items-center justify-center gap-2">
          <Button variant={'outline'} className="h-10 w-10 shadow-xl">
            <Link to={'https://x.com/gilroy_shawn'} target="_blank">
              <TwitterIcon className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant={'outline'} className="h-10 w-10 shadow-xl">
            <Link to={'https://github.com/miyamot0'} target="_blank">
              <GithubIcon className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant={'outline'} className="h-10 w-10 shadow-xl">
            <Link to={'https://www.smallnstats.com'} target="_blank">
              <HomeIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </footer>
    </main>
  );
}

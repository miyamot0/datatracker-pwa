import { GithubIcon, HomeIcon, TwitterIcon } from 'lucide-react';
import { Button } from '../../ui/button';

export default function LayoutFooter() {
  const MODALITY = import.meta.env.VITE_MODE === 'base' ? '' : ': Island Mode';

  return (
    <footer className="text-center text-sm text-gray-500 my-8 flex flex-col gap-4 select-none">
      <p>
        <a
          href={`https://github.com/miyamot0/datatracker-pwa`}
          className="underline text-muted-foreground transition-colors hover:text-foreground"
          target="_blank"
        >
          DataTracker (PWA)
        </a>{' '}
        is FOSS developed by{' '}
        <a
          href={'https://www.smallnstats.com'}
          className="underline text-muted-foreground transition-colors hover:text-foreground"
          target="_blank"
        >
          Shawn P. Gilroy
        </a>{' '}
        @{' '}
        <a
          href="https://www.lsu.edu/hss/psychology/faculty/school/gilroy.php"
          className="underline text-muted-foreground transition-colors hover:text-foreground"
          target="_blank"
        >
          Louisiana State University
        </a>
      </p>
      <p>
        {`Bugs and issues with the program can be reported on the `}
        <a
          href="https://github.com/miyamot0/datatracker-pwa/issues"
          className="underline text-muted-foreground transition-colors hover:text-foreground"
          target="_blank"
        >
          GitHub Issues page
        </a>
        .
      </p>
      <p>{`Build Version ${BUILD_VERSION} (${BUILD_DATE}${MODALITY})`}</p>
      <div className="flex flex-row items-center justify-center gap-2">
        <a aria-label="Link to Twitter/X page" href={'https://x.com/gilroy_shawn'} target="_blank">
          <Button
            name="Twitter button"
            aria-label="Twitter button"
            variant={'outline'}
            className="shadow-xl text-primary h-10 w-10 p-0 m-0"
          >
            <TwitterIcon className="h-4 w-4" />
          </Button>
        </a>

        <a aria-label="Link to GitHub website" href={'https://github.com/miyamot0'} target="_blank">
          <Button
            name="Github button"
            aria-label="Github button"
            variant={'outline'}
            className="shadow-xl text-primary h-10 w-10 p-0 m-0"
          >
            <GithubIcon className="h-4 w-4" />
          </Button>
        </a>

        <a aria-label="Link to SmallNStats website" href={'https://www.smallnstats.com'} target="_blank">
          <Button
            name="SmallNStats button"
            aria-label="SmallNStats button"
            variant={'outline'}
            className="shadow-xl text-primary h-10 w-10 p-0 m-0"
          >
            <HomeIcon className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </footer>
  );
}

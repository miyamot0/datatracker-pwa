import { cn } from '@/lib/utils';
import NavigationBar, { BreadCrumbListing } from './views/navigation-bar';
import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import LayoutFooter from './views/footer';
import ScrollReset from './views/scroll-reset';

type Props = {
  children: React.ReactNode;
  breadcrumbs?: BreadCrumbListing[];
  label?: string;
  className?: string;
  HideNavbar?: boolean;
  HideFooter?: boolean;
};

export default function PageWrapper({ children, className, breadcrumbs, label, HideNavbar, HideFooter }: Props) {
  const { settings } = useContext(FolderHandleContext);

  const hideFooter = HideFooter === true || settings.ApplicationFooterDisplay === 'Disabled';

  return (
    <main
      className={cn('flex min-h-screen flex-col items-center w-full py-4 mx-2 max-w-7xl self-center', className, {
        'max-w-[90rem]': settings.DisplaySize === 'wide',
        'max-w-[106rem]': settings.DisplaySize === 'extra-wide',
      })}
    >
      {!HideNavbar && <NavigationBar breadcrumbs={breadcrumbs} label={label} />}

      {children}

      {!hideFooter && <LayoutFooter />}
      <ScrollReset />
    </main>
  );
}

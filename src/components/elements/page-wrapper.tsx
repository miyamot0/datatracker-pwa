import { cn } from '@/lib/utils';
import NavigationBar, { BreadCrumbListing } from './header/navigation-bar';
import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import LayoutFooter from './footer/footer';
import ScrollReset from './behavior/scroll-reset';
import { ApplicationSettingsTypes } from '@/types/settings';

type Props = {
  children: React.ReactNode;
  breadcrumbs?: BreadCrumbListing[];
  label?: string;
  className?: string;
  HideNavbar?: boolean;
  HideFooter?: boolean;
  Settings?: ApplicationSettingsTypes;
};

export default function PageWrapper({
  children,
  className,
  breadcrumbs,
  label,
  HideNavbar,
  HideFooter,
  Settings,
}: Props) {
  const { settings: preSettings, handle } = useContext(FolderHandleContext);

  const settings = Settings ?? preSettings;

  const hideFooter = HideFooter === true || settings.ApplicationFooterDisplay === 'Disabled';

  return (
    <main
      className={cn('flex min-h-screen flex-col items-center w-full py-4 mx-2 max-w-7xl self-center', className, {
        'max-w-[90rem]': settings.DisplaySize === 'wide',
        'max-w-[106rem]': settings.DisplaySize === 'extra-wide',
        'max-w-full w-full': settings.SessionDisplay === 'FullScreen',
      })}
    >
      {!HideNavbar && <NavigationBar breadcrumbs={breadcrumbs} label={label} Settings={settings} Handle={handle} />}

      {children}

      {!hideFooter && <LayoutFooter />}
      <ScrollReset />
    </main>
  );
}

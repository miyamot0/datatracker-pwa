import { cn } from '@/lib/utils';
import NavigationBar, { BreadCrumbListing } from './views/navigation-bar';
import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import LayoutFooter from './views/footer';

type Props = {
  children: React.ReactNode;
  breadcrumbs?: BreadCrumbListing[];
  label?: string;
  className?: string;
};

export default function PageWrapper({ children, className, breadcrumbs, label }: Props) {
  const { settings } = useContext(FolderHandleContext);

  return (
    <main
      className={cn('flex min-h-screen flex-col items-center w-full py-4 mx-2 max-w-7xl self-center', className, {
        'max-w-[90rem]': settings.DisplaySize === 'wide',
        'max-w-[106rem]': settings.DisplaySize === 'extra-wide',
      })}
    >
      <NavigationBar breadcrumbs={breadcrumbs} label={label} />

      {children}

      <LayoutFooter />
    </main>
  );
}

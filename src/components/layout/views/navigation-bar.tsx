import React, { useContext } from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '../../ui/breadcrumb';
import AuthorizationStatus from './authorization-status';
import createHref from '@/lib/links';
import { Button } from '@/components/ui/button';
import { BookTextIcon, MenuIcon, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FolderHandleContext } from '@/context/folder-context';

export type BreadCrumbListing = {
  label: string;
  href: string;
};

type Props = {
  breadcrumbs?: BreadCrumbListing[];
  label?: string;
};

export default function NavigationBar({ breadcrumbs, label }: Props) {
  const { handle } = useContext(FolderHandleContext);

  return (
    <div className={cn('flex flex-row justify-between w-full max-w-screen-2xl py-4 items-center select-none')}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link unstable_viewTransition to={createHref({ type: 'Home' })} className={cn('underline')}>
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbs &&
            breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link unstable_viewTransition to={breadcrumb.href} className={cn('underline')}>
                      {breadcrumb.label}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            ))}

          {label && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{label}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-row gap-2 items-center">
        <AuthorizationStatus />

        <Link
          to={createHref({ type: 'Documentation' })}
          className="flex flex-row gap-2 items-center"
          unstable_viewTransition
        >
          <Button variant={'outline'} className="shadow-xl text-primary h-10 p-0 m-0 w-10 xl:w-fit xl:px-4">
            <BookTextIcon className="h-4 w-4" />
            <span className={cn('ml-2 hidden xl:block xl:p-0')}>Docs</span>
          </Button>
        </Link>

        <Link
          unstable_viewTransition
          to={createHref({ type: 'Sync Page' })}
          className={cn('flex flex-row gap-2 items-center', {
            'disabled cursor-default pointer-events-none opacity-50': !handle,
          })}
        >
          <Button
            name="Sync button"
            aria-label="Sync Button"
            variant="navigation"
            className="shadow-xl text-primary h-10 p-0 m-0 w-10 xl:w-fit xl:px-4"
          >
            <RefreshCcw className="h-4 w-4" />
            <span className={cn('ml-2 hidden xl:block xl:p-0')}>Sync</span>
          </Button>
        </Link>

        <Link
          unstable_viewTransition
          to={createHref({ type: 'Settings' })}
          className="flex flex-row gap-2 items-center"
        >
          <Button
            name="Settings button"
            aria-label="Settings Button"
            variant="navigation"
            className="shadow-xl text-primary h-10 p-0 m-0 w-10 xl:w-fit xl:px-4"
          >
            <MenuIcon className="h-4 w-4" />
            <span className={cn('ml-2 hidden xl:block xl:p-0')}>Settings</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

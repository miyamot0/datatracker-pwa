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
import { MenuIcon, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { FolderHandleContext } from '@/context/folder-context';
import { TRANSITION_CLASSES } from '@/types/transitions';

export type BreadCrumbListing = {
  label: string;
  href: string;
};

type Props = {
  breadcrumbs?: BreadCrumbListing[];
  label?: string;
};

export default function NavigationBar({ breadcrumbs, label }: Props) {
  const { handle, settings } = useContext(FolderHandleContext);

  const animTypes = TRANSITION_CLASSES[settings.TransitionBehavior];

  const animLeft = animTypes.length > 0 ? [animTypes[animTypes.length - 1]] : [];
  const animRight = animTypes.length > 0 ? [animTypes[0]] : [];

  return (
    <div className={cn('flex flex-row justify-between w-full py-4 items-center select-none')}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={createHref({ type: 'Home' })} className={cn('underline')} viewTransition={{ types: animLeft }}>
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
                    <Link to={breadcrumb.href} className={cn('underline')} viewTransition={{ types: animLeft }}>
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
          to={'/dashboard/sync'}
          className={cn('flex flex-row gap-2 items-center', {
            'disabled cursor-default pointer-events-none opacity-50': !handle,
          })}
          viewTransition={{ types: animRight }}
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

        <Link to={'/settings'} className="flex flex-row gap-2 items-center" viewTransition={{ types: animRight }}>
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

import React from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import AuthorizationStatus from '../header/authorization-status';
import { Button } from '@/components/ui/button';
import { MenuIcon, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { TRANSITION_CLASSES } from '@/types/transitions';
import { ApplicationSettingsTypes } from '@/types/settings';

export type BreadCrumbListing = {
  label: string;
  to: string;
};

type Props = {
  breadcrumbs?: BreadCrumbListing[];
  label?: string;
  Settings: ApplicationSettingsTypes;
  Handle: FileSystemDirectoryHandle | undefined;
};

export default function NavigationBar({ breadcrumbs, label, Settings, Handle }: Props) {
  const animTypes = TRANSITION_CLASSES[Settings.TransitionBehavior];

  const animLeft = animTypes.length > 0 ? [animTypes[animTypes.length - 1]] : [];
  const animRight = animTypes.length > 0 ? [animTypes[0]] : [];

  return (
    <div className={cn('flex flex-row justify-between w-full py-4 items-center select-none')}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className={cn('underline')} viewTransition={{ types: animLeft }}>
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
                    <Link to={breadcrumb.to} className={cn('underline')} viewTransition={{ types: animLeft }}>
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
        <AuthorizationStatus handle={Handle} />

        <Link
          to={'/dashboard/sync'}
          className={cn('flex flex-row gap-2 items-center', {
            'disabled cursor-default pointer-events-none opacity-50': !Handle,
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

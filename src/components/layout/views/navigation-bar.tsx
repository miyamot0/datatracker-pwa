import React from 'react';
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
import { MenuIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export type BreadCrumbListing = {
  label: string;
  href: string;
};

type Props = {
  breadcrumbs?: BreadCrumbListing[];
  label?: string;
};

export default function NavigationBar({ breadcrumbs, label }: Props) {
  return (
    <div className="flex flex-row justify-between w-full max-w-screen-2xl py-4 items-center select-none">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={createHref({ type: 'Home' })}>Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbs &&
            breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={breadcrumb.href}>{breadcrumb.label}</Link>
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

        <Button variant="navigation" className="w-10 h-10 p-1">
          <Link to={createHref({ type: 'Settings' })} className="flex flex-row gap-2 items-center">
            <MenuIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

import React from 'react';
import RouteGuard from '@/components/Auth/RouteGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>

      {children}

    </RouteGuard>
  );
}

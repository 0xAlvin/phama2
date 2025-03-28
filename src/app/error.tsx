'use client';

import ErrorBoundary from '@/components/errorboundary/ErrorBoundary';

export default function RootErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <ErrorBoundary error={error} reset={reset} />;
}

"use client";

import { useEffect, useState } from "react";

interface LoadingDelayProps {
    children: React.ReactNode;
    minDisplayTime?: number; // in milliseconds
}

/**
 * LoadingDelay Component
 * Ensures loading states display for a minimum duration
 * for better UX and to showcase animations
 */
export function LoadingDelay({ children, minDisplayTime = 1000 }: LoadingDelayProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, minDisplayTime);

        return () => clearTimeout(timer);
    }, [minDisplayTime]);

    if (!isReady) {
        return null; // Let Suspense loading.tsx show
    }

    return <>{children}</>;
}

// components/SplineAnimation.tsx
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the Spline component, ensuring it only runs on the client
const Spline = dynamic(() => import('@splinetool/react-spline/next'), {
  ssr: false,
});

export default function SplineAnimation() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-full rounded-lg" />}>
      <Spline scene="https://prod.spline.design/qIjHRYzrDY-SIfdj/scene.splinecode" />
    </Suspense>
  );
}


"use client"

import Spline from '@splinetool/react-spline/next';
import { Skeleton } from './ui/skeleton';

export function HeroAnimation() {
  return (
    <div className="relative w-full h-[400px] lg:h-[500px]">
      <Spline
        // This is a placeholder scene. Replace with your actual Spline scene URL.
        // You can create fantastic scenes at https://spline.design/
        scene="https://prod.spline.design/fz-5S2_iCPf-f8I5/scene.splinecode" 
      />
      {/* Fallback for when the Spline scene is loading */}
      <Skeleton className="absolute inset-0 w-full h-full" />
    </div>
  );
}


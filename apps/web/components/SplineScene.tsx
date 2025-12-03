"use client";

import Spline from "@splinetool/react-spline";

export default function SplineScene({ scene }: { scene: string }) {
  return <Spline scene={scene} />;
}

"use client";

import { useEffect, useRef } from "react";
import { Application } from "@splinetool/runtime";

export default function SplineViewer({ scene }: { scene: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const app = new Application(canvasRef.current);
    app.load(scene);
  }, [scene]);

  return <canvas ref={canvasRef} className="w-full h-full rounded-xl" />;
}

declare module "@splinetool/react-spline" {
  import * as React from "react";

  interface SplineProps {
    scene: string;
    onLoad?: (splineApp: any) => void;
    [key: string]: any; // allow extra props if needed
  }

  const Spline: React.FC<SplineProps>;
  export default Spline;
}


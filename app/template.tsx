"use client";

import { useEffect, useState } from "react";
import { RouteLoadingScreen } from "@/components/route-loading-screen";

const TRANSITION_MS = 720;

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="route-transition-root">
      {isTransitioning ? (
        <div className="route-transition-screen">
          <RouteLoadingScreen />
        </div>
      ) : null}
      <div
        className={isTransitioning ? "route-transition-content is-hidden" : "route-transition-content"}
      >
        {children}
      </div>
    </div>
  );
}

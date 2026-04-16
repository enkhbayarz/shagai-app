"use client";

import { useEffect } from "react";

type GestureEventName = "gesturestart" | "gesturechange" | "gestureend";

export function DisableMobileZoom() {
  useEffect(() => {
    let lastTouchEnd = 0;

    const preventGestureZoom = (event: Event) => {
      event.preventDefault();
    };

    const preventMultiTouchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();

      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }

      lastTouchEnd = now;
    };

    const options: AddEventListenerOptions = { passive: false };
    const gestureEvents: GestureEventName[] = [
      "gesturestart",
      "gesturechange",
      "gestureend",
    ];

    document.addEventListener("touchmove", preventMultiTouchZoom, options);
    document.addEventListener("touchend", preventDoubleTapZoom, options);
    gestureEvents.forEach((eventName) => {
      document.addEventListener(eventName, preventGestureZoom, options);
    });

    return () => {
      document.removeEventListener("touchmove", preventMultiTouchZoom);
      document.removeEventListener("touchend", preventDoubleTapZoom);
      gestureEvents.forEach((eventName) => {
        document.removeEventListener(eventName, preventGestureZoom);
      });
    };
  }, []);

  return null;
}

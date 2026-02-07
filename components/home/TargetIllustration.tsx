"use client";

import React from "react";

export function TargetIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-48 h-48 mx-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outermost ring */}
      <circle
        cx="100"
        cy="100"
        r="90"
        stroke="#d4d4d4"
        strokeWidth="2"
      />
      {/* Ring 2 */}
      <circle
        cx="100"
        cy="100"
        r="70"
        stroke="#a3a3a3"
        strokeWidth="2"
      />
      {/* Ring 3 */}
      <circle
        cx="100"
        cy="100"
        r="50"
        stroke="#737373"
        strokeWidth="2"
      />
      {/* Ring 4 */}
      <circle
        cx="100"
        cy="100"
        r="30"
        stroke="#404040"
        strokeWidth="2"
      />
      {/* Bullseye */}
      <circle cx="100" cy="100" r="10" fill="#10b981" />
      {/* Crosshair lines */}
      <line
        x1="100"
        y1="5"
        x2="100"
        y2="40"
        stroke="#a3a3a3"
        strokeWidth="1"
      />
      <line
        x1="100"
        y1="160"
        x2="100"
        y2="195"
        stroke="#a3a3a3"
        strokeWidth="1"
      />
      <line
        x1="5"
        y1="100"
        x2="40"
        y2="100"
        stroke="#a3a3a3"
        strokeWidth="1"
      />
      <line
        x1="160"
        y1="100"
        x2="195"
        y2="100"
        stroke="#a3a3a3"
        strokeWidth="1"
      />

      {/* Decorative dots - arrow hits */}
      <circle cx="85" cy="90" r="3" fill="#10b981" />
      <circle cx="105" cy="95" r="3" fill="#10b981" />
      <circle cx="95" cy="108" r="3" fill="#10b981" />
      <circle cx="110" cy="85" r="3" fill="#10b981" />
      <circle cx="92" cy="78" r="3" fill="#f43f5e" />
    </svg>
  );
}

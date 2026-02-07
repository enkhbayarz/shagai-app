"use client";

import { motion } from "framer-motion";

export function TargetIllustration() {
  // Minimalist geometric target - concentric circles with archery targets
  const circles = [
    { r: 120, delay: 0 },
    { r: 95, delay: 0.1 },
    { r: 70, delay: 0.2 },
    { r: 45, delay: 0.3 },
    { r: 20, delay: 0.4 },
  ];

  // Small target markers on the stand
  const targets = Array.from({ length: 10 }, (_, i) => ({
    x: 80 + i * 24,
    delay: 0.5 + i * 0.05,
  }));

  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg
        viewBox="0 0 400 300"
        className="w-full h-auto"
        aria-hidden="true"
      >
        {/* Background glow */}
        <defs>
          <radialGradient id="targetGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="standGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
        </defs>

        {/* Subtle glow behind target */}
        <ellipse cx="200" cy="120" rx="140" ry="100" fill="url(#targetGlow)" />

        {/* Stand/Platform */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {/* Stand base - perspective trapezoid */}
          <path
            d="M 50 260 L 80 200 L 320 200 L 350 260 Z"
            fill="url(#standGradient)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          {/* Stand top surface */}
          <path
            d="M 80 200 L 100 180 L 300 180 L 320 200 Z"
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
        </motion.g>

        {/* Small target markers on stand */}
        {targets.map((target, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: target.delay, duration: 0.3, type: "spring" }}
          >
            <rect
              x={target.x}
              y={168}
              width={16}
              height={20}
              rx={2}
              fill="rgba(255,255,255,0.9)"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="0.5"
            />
            <circle
              cx={target.x + 8}
              cy={178}
              r={5}
              fill="none"
              stroke="rgba(239, 68, 68, 0.8)"
              strokeWidth="1.5"
            />
            <circle
              cx={target.x + 8}
              cy={178}
              r={2}
              fill="rgba(239, 68, 68, 0.8)"
            />
          </motion.g>
        ))}

        {/* Main concentric circles - target */}
        <g transform="translate(200, 100)">
          {circles.map((circle, i) => (
            <motion.circle
              key={i}
              cx={0}
              cy={0}
              r={circle.r}
              fill="none"
              stroke={i === circles.length - 1 ? "rgba(245, 158, 11, 0.8)" : "rgba(255,255,255,0.15)"}
              strokeWidth={i === circles.length - 1 ? 2 : 1}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: circle.delay,
                duration: 0.5,
                type: "spring",
                stiffness: 100,
              }}
            />
          ))}

          {/* Center dot */}
          <motion.circle
            cx={0}
            cy={0}
            r={4}
            fill="rgba(245, 158, 11, 1)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3, type: "spring" }}
          />

          {/* Crosshair lines */}
          <motion.line
            x1={-130}
            y1={0}
            x2={130}
            y2={0}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          />
          <motion.line
            x1={0}
            y1={-130}
            x2={0}
            y2={80}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          />
        </g>
      </svg>
    </div>
  );
}

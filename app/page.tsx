"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TargetIllustration } from "@/components/home/TargetIllustration";

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      {/* Target Illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-12"
      >
        <TargetIllustration />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="font-display text-4xl md:text-5xl text-center mb-12 tracking-wider"
      >
        ШАГАЙ ХАРВАА
      </motion.h1>

      {/* Menu Buttons */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        {/* Team Shooting - Disabled */}
        <motion.div variants={itemVariants}>
          <Button
            variant="secondary"
            size="lg"
            className="w-full h-14 text-lg font-medium opacity-50 cursor-not-allowed"
            disabled
            aria-label="Багийн харваа - Удахгүй нээгдэнэ"
          >
            БАГИЙН ХАРВАА
          </Button>
        </motion.div>

        {/* Series Shooting - Active */}
        <motion.div variants={itemVariants}>
          <Link href="/series/setup" className="block">
            <Button
              variant="default"
              size="lg"
              className="w-full h-14 text-lg font-medium bg-white text-black hover:bg-white/90 touch-manipulation"
            >
              ЦУВАА ХАРВАА
            </Button>
          </Link>
        </motion.div>

        {/* Settings */}
        <motion.div variants={itemVariants}>
          <Link href="/settings" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg font-medium border-white/20 hover:bg-white/5 touch-manipulation"
            >
              ТОХИРГОО
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="mt-16 text-sm text-muted-foreground"
      >
        v1.0
      </motion.p>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TargetIllustration } from "@/components/home/TargetIllustration";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

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
      {/* Auth Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4"
      >
        <SignedOut>
          <div className="flex gap-2">
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="touch-manipulation">
                Нэвтрэх
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-black text-white hover:bg-black/90 touch-manipulation">
                Бүртгүүлэх
              </Button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />
        </SignedIn>
      </motion.div>

      {/* Target illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex justify-center mb-6"
      >
        <motion.div
          animate={{ rotate: [0, 1, -1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <TargetIllustration />
        </motion.div>
      </motion.div>

      {/* Text Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className="mb-12 text-center"
      >
        <h1 className="font-display text-7xl md:text-8xl tracking-widest leading-none">
          ШАГАЙ
        </h1>
        <h1 className="font-display text-5xl md:text-6xl tracking-[0.3em] text-black/70">
          ХАРВАА
        </h1>
      </motion.div>

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
          <SignedIn>
            <Link href="/series/setup" className="block">
              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-lg font-medium bg-black text-white hover:bg-black/90 touch-manipulation"
              >
                ЦУВАА ХАРВАА
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-lg font-medium bg-black text-white hover:bg-black/90 touch-manipulation"
              >
                ЦУВАА ХАРВАА
              </Button>
            </SignInButton>
          </SignedOut>
        </motion.div>

        {/* Live Games - Public, no auth required */}
        <motion.div variants={itemVariants}>
          <Link href="/live" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg font-medium border-black/20 hover:bg-black/5 touch-manipulation relative"
            >
              <span className="absolute left-4 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              ШУУД
            </Button>
          </Link>
        </motion.div>

        {/* Dashboard - Public */}
        <motion.div variants={itemVariants}>
          <Link href="/home" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg font-medium border-black/20 hover:bg-black/5 touch-manipulation"
            >
              ХӨТӨЧ
            </Button>
          </Link>
        </motion.div>

        {/* Clan - Auth required */}
        <motion.div variants={itemVariants}>
          <SignedIn>
            <Link href="/clans" className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg font-medium border-black/20 hover:bg-black/5 touch-manipulation"
              >
                КЛАН
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg font-medium border-black/20 hover:bg-black/5 touch-manipulation"
              >
                КЛАН
              </Button>
            </SignInButton>
          </SignedOut>
        </motion.div>

        {/* History */}
        <motion.div variants={itemVariants}>
          <SignedIn>
            <Link href="/history" className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg font-medium border-black/20 hover:bg-black/5 touch-manipulation"
              >
                ТҮҮХ
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg font-medium border-black/20 hover:bg-black/5 touch-manipulation"
              >
                ТҮҮХ
              </Button>
            </SignInButton>
          </SignedOut>
        </motion.div>

        {/* Settings */}
        <motion.div variants={itemVariants}>
          <Link href="/settings" className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg font-medium border-black/20 hover:bg-black/5 touch-manipulation"
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
        v2.0
      </motion.p>
    </div>
  );
}

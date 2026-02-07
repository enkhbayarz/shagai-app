"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  // Load email from localStorage on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("shagai-email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("shagai-email", email);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 touch-manipulation"
            aria-label="Буцах"
          >
            <ArrowLeft className="w-4 h-4" />
            БУЦАХ
          </Button>
        </Link>
        <h1 className="font-display text-2xl tracking-wider">ТОХИРГОО</h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </motion.header>

      {/* Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md mx-auto"
      >
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Имэйл тохиргоо
            </CardTitle>
            <CardDescription>
              Үр дүн илгээх имэйл хаягаа оруулна уу
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Имэйл хаяг
              </label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                autoComplete="email"
                spellCheck={false}
              />
            </div>

            <Button
              onClick={handleSave}
              className="w-full h-12 gap-2 touch-manipulation"
              disabled={!email || saved}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  ХАДГАЛСАН
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  ХАДГАЛАХ
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Имэйл илгээх үйлдэл удахгүй нэмэгдэнэ
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

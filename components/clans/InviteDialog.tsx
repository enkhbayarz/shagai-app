"use client";

import { useState, useRef, useCallback } from "react";
import { Search, User, Link2, Check, Clock } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clanId: Id<"clans">;
  inviterId: Id<"users">;
  inviteCode: string;
}

export function InviteDialog({
  open,
  onOpenChange,
  clanId,
  inviterId,
  inviteCode,
}: InviteDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchResults = useQuery(
    api.users.search,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );

  const pendingInvites = useQuery(api.clans.getClanInvites, { clanId });

  const inviteMutation = useMutation(api.clans.invite);

  const handleInvite = useCallback(async (userId: Id<"users">) => {
    if (invitingUserId) return;
    setInviteError("");
    setInvitingUserId(userId);
    try {
      await inviteMutation({ clanId, inviterId, inviteeId: userId });
      setSentTo((prev) => new Set(prev).add(userId));
    } catch (error: any) {
      setInviteError(error.message || "Урилга илгээхэд алдаа гарлаа");
    } finally {
      setInvitingUserId(null);
    }
  }, [invitingUserId, inviteMutation, clanId, inviterId]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/clans/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setInviteError("Хуулж чадсангүй");
    }
  }, [inviteCode]);

  const pendingUserIds = new Set(
    pendingInvites?.map((inv) => inv.inviteeId) ?? []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wider">
            Гишүүн урих
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Нэр, хэрэглэгчийн нэр..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoComplete="off"
            />
          </div>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {searchResults.slice(0, 5).map((user) => {
                const alreadyInvited =
                  pendingUserIds.has(user._id) || sentTo.has(user._id);
                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">
                          {user.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                    {alreadyInvited ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Урьсан
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInvite(user._id)}
                        disabled={invitingUserId === user._id}
                        className="text-xs"
                      >
                        {invitingUserId === user._id ? "..." : "Урих"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery.length >= 2 &&
            searchResults &&
            searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Хэрэглэгч олдсонгүй
              </p>
            )}

          {inviteError && (
            <p className="text-sm text-red-500 text-center">{inviteError}</p>
          )}

          {/* Invite Link */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block">
              Урилгын холбоос
            </label>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full gap-2 touch-manipulation"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Хуулсан!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Холбоос хуулах
                </>
              )}
            </Button>
          </div>

          {/* Pending Invites */}
          {pendingInvites && pendingInvites.length > 0 && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">
                Хүлээгдэж буй урилгууд ({pendingInvites.length})
              </label>
              <div className="space-y-1">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv._id}
                    className="flex items-center gap-2 text-sm text-muted-foreground py-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      {inv.inviteeName} (@{inv.inviteeUsername})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Ensures Clerk users are synced to Convex on sign-in.
 * Calls createOrGetUser when a Clerk user exists but no Convex user record is found.
 */
export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getMe, clerkUser ? {} : "skip");
  const createUser = useMutation(api.users.createOrGetUser);

  useEffect(() => {
    // Only run when: Clerk loaded, user signed in, query finished, no Convex user
    if (isLoaded && clerkUser && currentUser === null) {
      createUser({
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        fullName: clerkUser.fullName || clerkUser.firstName || "User",
        username: clerkUser.username || `user_${clerkUser.id.slice(-6)}`,
      });
    }
  }, [isLoaded, clerkUser, currentUser, createUser]);

  return <>{children}</>;
}

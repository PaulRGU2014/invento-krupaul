"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type UserProfile = {
  name: string;
  email: string;
};

type Ctx = {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
};

const UserProfileContext = createContext<Ctx | undefined>(undefined);

export function UserProfileProvider({
  children,
  initialName = "",
  initialEmail = "",
}: {
  children: React.ReactNode;
  initialName?: string;
  initialEmail?: string;
}) {
  const [profile, setProfile] = useState<UserProfile>({
    name: initialName,
    email: initialEmail,
  });

  // Keep context in sync if the initial values change (e.g., session loads)
  useEffect(() => {
    setProfile((prev) => ({
      name: initialName || prev.name,
      email: initialEmail || prev.email,
    }));
  }, [initialName, initialEmail]);

  const value = useMemo(() => ({ profile, setProfile }), [profile]);
  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}

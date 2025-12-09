"use client";

import Link from "next/link";

export default function SettingsLink({ className = "" }: { className?: string }) {
  return (
    <Link href="/account-settings" className={className}>
      Account Settings
    </Link>
  );
}

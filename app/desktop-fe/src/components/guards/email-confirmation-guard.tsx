"use client";
import React, { useState } from "react";
import { useSupabaseSession, useSupabase } from "@/components/providers/supabase-provider";

interface Props {
  children: React.ReactNode;
}

export function EmailConfirmationGuard({ children }: Props) {
  const { user, authenticated, loading } = useSupabaseSession();
  const { supabase } = useSupabase();
  const [resendStatus, setResendStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (loading) {
    return <div style={{ padding: 32 }}>Loading session...</div>;
  }

  // Not logged in yet, let upstream route decide (login page handles redirect)
  if (!authenticated || !user) {
    return <>{children}</>; // allow child to show its own unauth UI
  }

  const confirmed = !!(user.email_confirmed_at || (user as any).confirmed_at);

  if (confirmed) {
    return <>{children}</>; // everything ok
  }

  const resend = async () => {
    if (resendStatus === "sending") return;
    setResendStatus("sending");
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email! });
      if (error) {
        setResendStatus("error");
        setErrorMsg(error.message);
      } else {
        setResendStatus("sent");
      }
    } catch (e: any) {
      setResendStatus("error");
      setErrorMsg(e?.message || "Failed to resend confirmation email");
    }
  };

  return (
    <div style={{
      maxWidth: 480,
      margin: "64px auto",
      padding: "32px 28px",
      border: "1px solid #ddd",
      borderRadius: 12,
      background: "#fff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      fontFamily: "inherit"
    }}>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>Confirm your email</h2>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        We created your account but need you to confirm <strong>{user.email}</strong> before granting access.
        Please check your inbox (and spam) for a confirmation link.
      </p>
      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={resend}
          disabled={resendStatus === 'sending' || resendStatus === 'sent'}
          style={{
            padding: '10px 16px',
            background: resendStatus === 'sent' ? '#16a34a' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: resendStatus === 'sent' ? 'default' : 'pointer'
          }}
        >
          {resendStatus === 'sending' && 'Sending...'}
          {resendStatus === 'idle' && 'Resend confirmation email'}
          {resendStatus === 'sent' && 'Email sent'}
          {resendStatus === 'error' && 'Retry send'}
        </button>
        <button
          onClick={async () => {
            setErrorMsg(null);
            // Refresh session state to see if email got confirmed meanwhile
            const { data } = await supabase.auth.getSession();
            if (data.session?.user?.email_confirmed_at || (data.session?.user as any)?.confirmed_at) {
              // Force a re-render by updating internal state via auth listener already present
              location.reload();
            } else {
              setErrorMsg('Still not confirmed yet.');
            }
          }}
          style={{
            padding: '10px 16px',
            background: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          I have confirmed – check again
        </button>
      </div>
      {errorMsg && <p style={{ color: '#dc2626', marginTop: 12 }}>{errorMsg}</p>}
      <p style={{ fontSize: 12, marginTop: 24, color: '#555' }}>
        If you didn’t receive the email within a minute, click resend. Once confirmed this screen disappears automatically.
      </p>
    </div>
  );
}

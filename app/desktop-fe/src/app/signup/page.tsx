"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import styles from "./page.module.scss";
import Logo from "@/components/logos/logo";
import GoogleLogo from "@/components/logos/google-logo";
// import FacebookLogo from "@/components/logos/facebook-logo";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase } = useSupabase();

  const passwordsMatch = password === confirmPassword;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (signupError) {
        setError(signupError.message || "Signup failed");
        setLoading(false);
        return;
      }
      // Optionally auto-login; Supabase may send confirmation email depending on project settings
      router.replace("/home");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className={styles.signupContainer}>
        <div className={styles.signupHeader}>
          <div className={styles.logo}>
            <Logo width={40} height={40} />
          </div>
          <h1 className={styles.signupTitle}>Create your account</h1>
          <p className={styles.signupSubtitle}>Start managing inventory</p>
        </div>
        <form className={styles.signupForm} onSubmit={onSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="fullName">Full Name</label>
            <div className={styles.inputWrapper}>
              <HiOutlineUser className={styles.inputIcon} />
              <input
                id="fullName"
                type="text"
                value={fullName}
                placeholder="Jane Doe"
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <HiOutlineMail className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <HiOutlineLockClosed className={styles.inputIcon} />
              <input
                id="password"
                type="password"
                value={password}
                placeholder="Create a password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.inputWrapper}>
              <HiOutlineLockClosed className={styles.inputIcon} />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                placeholder="Repeat your password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
          {!passwordsMatch && confirmPassword && !error && (
            <p className={styles.errorMessage}>Passwords must match.</p>
          )}
          <button
            className={styles.signupButtonPrimary + (!passwordsMatch ? " " + styles.disabled : "")}
            type="submit"
            disabled={loading || !passwordsMatch}
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
          <div className={styles.divider}>
            <span className={styles.orText}>Or continue with</span>
          </div>
          <div className={styles.buttonWrapper}>
            <button
              className={styles.socialButton}
              type="button"
              onClick={async () => {
                setGoogleError(null);
                const redirectBase = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                try {
                  const { error: oauthError } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${redirectBase}/home` }
                  });
                  if (oauthError) setGoogleError(oauthError.message);
                } catch (e: unknown) {
                  setGoogleError(e instanceof Error ? e.message : 'Google sign-in failed');
                }
              }}
            >
              <GoogleLogo width={24} height={24} />
              Continue with Google
            </button>
            {googleError && <p className={styles.errorMessage}>{googleError}</p>}
            {/* <button
              className={styles.socialButton}
              type="button"
              onClick={() => signIn("facebook", { callbackUrl: "/home" })}
            >
              <FacebookLogo width={24} height={24} />
              Continue with Facebook
            </button> */}
          </div>
          <button
            className={styles.loginLinkButton}
            type="button"
            onClick={() => router.push("/login")}
          >
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";
import Logo from "@/components/logos/logo";
import GoogleLogo from "@/components/logos/google-logo";
// import FacebookLogo from "@/components/logos/facebook-logo";
import { HiOutlineMail, HiOutlineLockClosed  } from "react-icons/hi";
import { useSupabaseSession, useSupabase } from "@/components/providers/supabase-provider";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { authenticated } = useSupabaseSession();
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated) {
      router.replace("/home");
    }
  }, [authenticated, router]);

  if (authenticated) {
    return (
      <div className="login">
        <div className={styles.loginContainer}>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p>{t('login.redirecting', 'Redirecting...')}</p>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error(error.message);
        return;
      }
      router.replace("/home");
    })();
  };

  return (
    <div className="login">
    <div className={styles.loginContainer}>
      <div className={styles.loginHeader}>
        <div className={styles.logo}>
          <Logo width={40} height={40} />
        </div>
        <h1 className={styles.loginTitle}>{t('login.manager', 'Inventory Manager')}</h1>
        <p className={styles.loginSubtitle}>{t('login.subtitle', 'Sign in to your account')}</p>
      </div>

      <form className={styles.loginForm} onSubmit={onSubmit}>
        <div className={styles.loginData}>
          <label htmlFor="email">{t('login.email', 'Email')}</label>
          <div className={styles.inputWrapper}>
            <HiOutlineMail className={styles.inputIcon} />
            <input
              id="email"
              type="email"
              value={email}
              placeholder={t('login.placeholderEmail', 'you@example.com')}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className={styles.loginData}>
          <label htmlFor="password">{t('login.password', 'Password')}</label>
          <div className={styles.inputWrapper}>
            <HiOutlineLockClosed className={styles.inputIcon} />
            <input
              id="password"
              type="password"
              value={password}
              placeholder={t('login.placeholderPassword', 'Enter your password')}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <button className={styles.loginButton} type="submit">
          {t('login.buttonLogin', 'Login')}
        </button>
        <div className={styles.divider}>
          <span className={styles.orText}>{t('login.orContinue', 'Or continue with')}</span>
        </div>
        <div className={styles.buttonWrapper}>
          <button
            className={styles.socialButton}
            type="button"
            onClick={async () => {
              setGoogleError(null);
              const redirectBase = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
              try {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${redirectBase}/home` }
                });
                if (error) setGoogleError(error.message);
              } catch (e: unknown) {
                setGoogleError(e instanceof Error ? e.message : 'Google sign-in failed');
              }
            }}
          >
            <GoogleLogo width={24} height={24} />
            {t('login.continueGoogle', 'Continue with Google')}
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
          className={styles.signupButton}
          type="button"
          onClick={() => router.push("/signup")}
        >
          {t('login.signupCta', "Don't have an account? Sign up")}
        </button>
      </form>
    </div>
    </div>
  );
}

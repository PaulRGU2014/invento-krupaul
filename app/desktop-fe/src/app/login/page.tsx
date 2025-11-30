"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";
import Logo from "@/components/logo";
import GoogleLogo from "@/components/google-logo";
import FacebookLogo from "@/components/facebook-logo";
import { HiOutlineMail, HiOutlineLockClosed  } from "react-icons/hi";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (session) {
    router.replace("/home");
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Credentials login via NextAuth
    signIn("credentials", {
      email,
      password,
      callbackUrl: "/home",
    });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginHeader}>
        <div className={styles.logo}>
          <Logo width={40} height={40} />
        </div>
        <h1 className={styles.loginTitle}>Inventory Manager</h1>
        <p className={styles.loginSubtitle}>Sign in to your account</p>
      </div>

      <form className={styles.loginForm} onSubmit={onSubmit}>
        <div className={styles.loginData}>
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
        <div className={styles.loginData}>
          <label htmlFor="password">Password</label>
          <div className={styles.inputWrapper}>
            <HiOutlineLockClosed className={styles.inputIcon} />
            <input
              id="password"
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <button className={styles.loginButton} type="submit">
          Login
        </button>
        <div className={styles.divider}>
          <span className={styles.orText}>Or continue with</span>
        </div>
        <div className={styles.buttonWrapper}>
          <button
            className={styles.socialButton}
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/home" })}
          >
            <GoogleLogo width={24} height={24} />
            Continue with Google
          </button>
          <button
            className={styles.socialButton}
            type="button"
            onClick={() => signIn("facebook", { callbackUrl: "/home" })}
          >
            <FacebookLogo width={24} height={24} />
            Continue with Facebook
          </button>
        </div>
        <button
          className={styles.signupButton}
          type="button"
          onClick={() => router.push("/signup")}
        >
          Don't have an account? Sign up
        </button>
      </form>
    </div>
  );
}

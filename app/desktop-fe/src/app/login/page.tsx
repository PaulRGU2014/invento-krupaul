"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";
import Logo from "@/components/logo";

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
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.loginData}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className={styles.loginButton}
          type="submit"
        >
          Login
        </button>            
        <div className={styles.buttonWrapper}>      
          <button
            className={styles.googleButton}
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/home" })}
          >
            Continue with Google
          </button>
          <button
            className={styles.signupButton}
            type="button"
            onClick={() => router.push("/signup")}
          >
            Create account
          </button>
          {/* <button type="button" onClick={() => signIn("facebook", { callbackUrl: "/home" })}>
            Continue with Facebook
          </button>           */}
        </div>
      </form>
    </div>
  );
}

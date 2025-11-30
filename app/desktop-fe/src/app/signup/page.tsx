"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Signup failed" }));
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }
      router.push("/login");
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Create account</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Sign up"}</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}

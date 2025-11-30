"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div>
      <header>
        <div>
          <h1>Inventory Manager</h1>
          <div>
            <span>{session?.user?.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <main>
        <div>
          <button onClick={() => alert("Dashboard view coming soon")}>Dashboard</button>
          <button onClick={() => alert("Inventory list coming soon")}>Inventory</button>
          <button onClick={() => alert("Item form coming soon")}>{"Add Item"}</button>
        </div>
        <section>
          <h2>Welcome{session?.user?.name ? `, ${session.user.name}` : ""}!</h2>
          <p>This is your home page. We’ll hook up Dashboard, Inventory, and ItemForm next based on your Figma components.</p>
        </section>
      </main>
    </div>
  );
}

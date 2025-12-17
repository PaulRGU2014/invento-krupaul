"use client";

import FeedbackForm from "@/components/feedback/feedback-form";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FeedbackPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitted = () => {
    setSubmitted(true);
    // Attempt to close this window if it was opened via window.open
    // If not allowed, navigate back to home
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.close();
        // If window couldn't be closed (opened in same tab), navigate home
        router.replace("/home");
      }
    }, 800);
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <FeedbackForm onSubmitted={handleSubmitted} />
      {submitted && (
        <div style={{ marginTop: 8, color: "#364153" }}>
          Thanks! This window will close automatically.
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import styles from "./feedback-form.module.scss";
import { useI18n } from "@/lib/i18n";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
};

export function FeedbackForm({ defaultName = "", defaultEmail = "" }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [comments, setComments] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      // If not configured, allow submission but warn
      setRecaptchaReady(true);
      return;
    }
    // Load reCAPTCHA v3 script if not present
    if (!(window as any).grecaptcha) {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.onload = () => setRecaptchaReady(true);
      script.onerror = () => setRecaptchaReady(false);
      document.head.appendChild(script);
    } else {
      setRecaptchaReady(true);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string; // data URL
        const base64 = result.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      let recaptchaToken: string | undefined = undefined;
      if (siteKey && recaptchaReady && (window as any).grecaptcha) {
        recaptchaToken = await (window as any).grecaptcha.execute(siteKey, { action: "feedback_submit" });
      }
      let attachment: { filename: string; content: string } | null = null;
      if (imageFile) {
        const base64 = await fileToBase64(imageFile);
        attachment = { filename: imageFile.name, content: base64 };
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, comments, attachment, recaptchaToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json?.error === "recaptcha") {
          setStatus(t("feedback.recaptcha.error", "reCAPTCHA verification failed. Please retry."));
          throw new Error("recaptcha");
        }
        throw new Error(json.error || "Failed to send feedback");
      }
      setStatus(t("feedback.success", "Thanks for your feedback!"));
      setComments("");
      setImageFile(null);
    } catch (err: any) {
      setStatus(t("feedback.error", "Unable to send feedback. Try again later."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{t("feedback.title", "Share Feedback")}</h2>
      <p className={styles.subtitle}>{t("feedback.subtitle", "We value your thoughts and ideas.")}</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.row}> 
          <div className={styles.field}> 
            <label className={styles.label}>{t("feedback.name", "Name")}</label>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("feedback.name.placeholder", "Your name")}
            />
          </div>
          <div className={styles.field}> 
            <label className={styles.label}>{t("feedback.email", "Email")}</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("feedback.email.placeholder", "you@example.com")}
            />
          </div>
        </div>
        <div className={styles.field}> 
          <label className={styles.label}>{t("feedback.comments", "Comments")}</label>
          <textarea
            className={styles.textarea}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={t("feedback.comments.placeholder", "Tell us what's on your mind...")}
            rows={6}
          />
        </div>
        <div className={styles.field}> 
          <label className={styles.label}>{t("feedback.image", "Optional Image")}</label>
          <input className={styles.file} type="file" accept="image/*" onChange={onFileChange} />
        </div>
        <div className={styles.actions}> 
          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? t("feedback.sending", "Sending...") : t("feedback.submit", "Send Feedback")}
          </button>
        </div>
        {status && <div className={styles.status}>{status}</div>}
      </form>
    </div>
  );
}

export default FeedbackForm;
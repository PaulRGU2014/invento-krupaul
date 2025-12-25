"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BillingContent } from '@/components/billing/billing-content';

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(960px, 100%)',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 24px 70px rgba(0,0,0,0.22)',
          padding: '24px',
          position: 'relative',
        }}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export default function BillingInterceptModal() {
  const router = useRouter();
  const close = () => router.back();

  return (
    <ModalOverlay onClose={close}>
      <BillingContent />
    </ModalOverlay>
  );
}

import { BillingContent } from '@/components/billing/billing-content';

export default function BillingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 16px' }}>
        <BillingContent />
      </div>
    </div>
  );
}

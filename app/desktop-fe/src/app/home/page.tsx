"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession, useSupabase } from "@/components/providers/supabase-provider";
import { Package, LogOut, User } from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { fetchInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/lib/inventory-api";
import { Dashboard } from "@/components/dashboard/dashboard";
import SettingsForm from "@/components/dashboard/account-settings/SettingsForm";
import { InventoryList } from "@/components/inventory/inventory-list";
import { ItemForm } from "@/components/inventory/item-form";
import styles from "./page.module.scss";
import { useI18n } from "@/lib/i18n";
import { EmailConfirmationGuard } from "@/components/guards/email-confirmation-guard";
import { UserProfileProvider, useUserProfile } from "@/components/providers/user-profile-context";

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { session, authenticated, loading } = useSupabaseSession();
  const { supabase } = useSupabase();
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'add' | 'settings'>('dashboard');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/login");
    }
  }, [router, loading, authenticated]);

  useEffect(() => {
    const load = async () => {
      if (!authenticated) return;
      const res = await fetchInventory(1, 100);
      if (res?.success && Array.isArray(res.data)) {
        setItems(res.data);
      }
    };
    load();
  }, [authenticated]);

  const handleAddItem = async (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const payload = {
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock,
      price: item.price,
      supplier: item.supplier,
    };
    const res = await createInventoryItem(payload);
    if (res?.success && res.data) {
      setItems(prev => [res.data, ...prev]);
      setActiveView('inventory');
    }
  };

  const handleUpdateItem = async (updatedItem: InventoryItem | Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    if (!('id' in updatedItem)) return;
    const payload = {
      name: updatedItem.name,
      category: updatedItem.category,
      quantity: updatedItem.quantity,
      unit: updatedItem.unit,
      minStock: updatedItem.minStock,
      price: updatedItem.price,
      supplier: updatedItem.supplier,
    };
    const res = await updateInventoryItem(updatedItem.id, payload);
    if (res?.success && res.data) {
      setItems(prev => prev.map(item => item.id === updatedItem.id ? res.data : item));
      setEditingItem(null);
      setActiveView('inventory');
    }
  };

  const handleDeleteItem = async (id: string) => {
    const res = await deleteInventoryItem(id);
    if (res?.success) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleInlineUpdate = async (id: string, updates: Pick<InventoryItem, 'quantity' | 'price'>) => {
    const existing = items.find(item => item.id === id);
    if (!existing) return;

    const payload = {
      name: existing.name,
      category: existing.category,
      quantity: updates.quantity,
      unit: existing.unit,
      minStock: existing.minStock,
      price: updates.price,
      supplier: existing.supplier,
    };

    const res = await updateInventoryItem(id, payload);
    if (res?.success && res.data) {
      setItems(prev => prev.map(item => item.id === id ? res.data : item));
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setActiveView('add');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setActiveView('inventory');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading...</div>
      </div>
    );
  }

  const displayName = (session?.user?.user_metadata as { full_name?: string } | undefined)?.full_name || "";
  const email = session?.user?.email || "";

  return (
    <EmailConfirmationGuard>
    <UserProfileProvider initialName={displayName} initialEmail={email}>
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <div className={styles.logoBox}>
              <Package size={24} />
            </div>
            <div className={styles.titleGroup}>
              <h1>{t("home.welcome", "Inventory Manager")}</h1>
              <p>{t("home.intro", "Track and manage your stock")}</p>
            </div>
          </div>
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <User size={20} />
              <HeaderUserNameFallback sessionName={displayName} sessionEmail={email} />
            </div>
            <button onClick={handleLogout} className={styles.logoutButton} title={t("login.title", "Logout")}>
              <LogOut size={20} />
              <span>{t("login.submit", "Logout")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <button
            onClick={() => {
              setActiveView('dashboard');
              setEditingItem(null);
            }}
            className={`${styles.navButton} ${activeView === 'dashboard' ? styles.active : ''}`}
          >
            {t("dashboard.title", "Dashboard")}
          </button>
          <button
            onClick={() => {
              setActiveView('inventory');
              setEditingItem(null);
            }}
            className={`${styles.navButton} ${activeView === 'inventory' ? styles.active : ''}`}
          >
            {t("inventory.title", "Inventory")}
          </button>
          <button
            onClick={() => setActiveView('add')}
            className={`${styles.navButton} ${activeView === 'add' ? styles.active : ''}`}
          >
            {editingItem ? t("inventory.editItem", "Edit Item") : t("inventory.addItem", "Add Item")}
          </button>          
          <button
            onClick={() => {
              setActiveView('settings');
              setEditingItem(null);
            }}
            className={`${styles.navButton} ${activeView === 'settings' ? styles.active : ''}`}
          >
            {t("settings.title", "Settings")}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {activeView === 'dashboard' && <Dashboard items={items} />}
        {activeView === 'settings' && <SettingsForm />}
        {activeView === 'inventory' && (
          <InventoryList
            items={items}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onInlineUpdate={handleInlineUpdate}
          />
        )}
        {activeView === 'add' && (
          <ItemForm
            item={editingItem}
            onSubmit={editingItem ? handleUpdateItem : handleAddItem}
            onCancel={handleCancelEdit}
          />
        )}
      </main>
    </div>
    </UserProfileProvider>
    </EmailConfirmationGuard>
  );
}

function HeaderUserNameFallback({ sessionName, sessionEmail }: { sessionName: string; sessionEmail: string }) {
  const { profile } = useUserProfile();
  const nameToShow = profile.name || sessionName || sessionEmail;
  return <span>{nameToShow}</span>;
}

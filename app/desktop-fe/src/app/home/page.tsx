"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Package, LogOut, User } from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { Dashboard } from "@/components/dashboard";
import { InventoryList } from "@/components/inventory-list";
import { ItemForm } from "@/components/item-form";
import styles from "./page.module.scss";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'add'>('dashboard');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Tomatoes',
      category: 'Vegetables',
      quantity: 45,
      unit: 'kg',
      minStock: 20,
      price: 2.5,
      supplier: 'Fresh Farms Co.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Chicken Breast',
      category: 'Meat',
      quantity: 12,
      unit: 'kg',
      minStock: 15,
      price: 8.99,
      supplier: 'Quality Meats Ltd.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Olive Oil',
      category: 'Oils & Condiments',
      quantity: 8,
      unit: 'liters',
      minStock: 10,
      price: 12.5,
      supplier: 'Mediterranean Imports',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Pasta',
      category: 'Dry Goods',
      quantity: 35,
      unit: 'kg',
      minStock: 25,
      price: 1.8,
      supplier: 'Italian Foods Inc.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'Milk',
      category: 'Dairy',
      quantity: 6,
      unit: 'liters',
      minStock: 20,
      price: 1.2,
      supplier: 'Local Dairy Farm',
      lastUpdated: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  const handleAddItem = (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString(),
    };
    setItems([...items, newItem]);
    setActiveView('inventory');
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setItems(items.map(item => 
      item.id === updatedItem.id 
        ? { ...updatedItem, lastUpdated: new Date().toISOString() }
        : item
    ));
    setEditingItem(null);
    setActiveView('inventory');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setActiveView('add');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setActiveView('inventory');
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <div className={styles.loading}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <div className={styles.logoBox}>
              <Package size={24} />
            </div>
            <div className={styles.titleGroup}>
              <h1>Inventory Manager</h1>
              <p>Track and manage your stock</p>
            </div>
          </div>
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <User size={20} />
              <span>{session?.user?.name || session?.user?.email}</span>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton} title="Logout">
              <LogOut size={20} />
              <span>Logout</span>
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
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveView('inventory');
              setEditingItem(null);
            }}
            className={`${styles.navButton} ${activeView === 'inventory' ? styles.active : ''}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveView('add')}
            className={`${styles.navButton} ${activeView === 'add' ? styles.active : ''}`}
          >
            {editingItem ? 'Edit Item' : 'Add Item'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {activeView === 'dashboard' && <Dashboard items={items} />}
        {activeView === 'inventory' && (
          <InventoryList
            items={items}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
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
  );
}

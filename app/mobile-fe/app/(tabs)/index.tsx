import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LogOut, Package } from 'lucide-react-native';
import { useAuth } from '@/components/auth-context';
import { Dashboard } from '@/components/dashboard';
import { InventoryList } from '@/components/inventory-list';
import { ItemForm } from '@/components/item-form';
import { InventoryItem } from '@/types/inventory';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'add'>('dashboard');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Tomatoes',
      category: 'Vegetables',
      quantity: 50,
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
      quantity: 15,
      unit: 'kg',
      minStock: 25,
      price: 8.99,
      supplier: 'Quality Meats Ltd.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Olive Oil',
      category: 'Pantry',
      quantity: 30,
      unit: 'liters',
      minStock: 10,
      price: 12.5,
      supplier: 'Mediterranean Imports',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Pasta',
      category: 'Pantry',
      quantity: 100,
      unit: 'kg',
      minStock: 50,
      price: 1.25,
      supplier: 'Italian Goods Co.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'Milk',
      category: 'Dairy',
      quantity: 40,
      unit: 'liters',
      minStock: 30,
      price: 1.89,
      supplier: 'Local Dairy Farm',
      lastUpdated: new Date().toISOString(),
    },
  ]);

  const handleAddItem = (itemData: any) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString(),
    };
    setItems([...items, newItem]);
    setActiveView('dashboard');
    Alert.alert('Success', 'Item added successfully!');
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
    setActiveView('inventory');
    Alert.alert('Success', 'Item updated successfully!');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    Alert.alert('Success', 'Item deleted successfully!');
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setActiveView('add');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Package color="#007bff" size={24} />
            </View>
            <View style={styles.titleGroup}>
              <Text style={styles.title}>Invento</Text>
              <Text style={styles.subtitle}>Inventory Management</Text>
            </View>
          </View>
          <View style={styles.userSection}>
            <View>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <LogOut color="#6b7280" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navContent}>
          <TouchableOpacity
            style={[styles.navButton, activeView === 'dashboard' && styles.navButtonActive]}
            onPress={() => { setActiveView('dashboard'); setEditingItem(null); }}
          >
            <Text style={[styles.navButtonText, activeView === 'dashboard' && styles.navButtonTextActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, activeView === 'inventory' && styles.navButtonActive]}
            onPress={() => { setActiveView('inventory'); setEditingItem(null); }}
          >
            <Text style={[styles.navButtonText, activeView === 'inventory' && styles.navButtonTextActive]}>
              All Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, activeView === 'add' && styles.navButtonActive]}
            onPress={() => { setActiveView('add'); setEditingItem(null); }}
          >
            <Text style={[styles.navButtonText, activeView === 'add' && styles.navButtonTextActive]}>
              Add Item
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
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
            onCancel={() => {
              setEditingItem(null);
              setActiveView('inventory');
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    gap: 12,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  nav: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navButtonActive: {
    borderBottomColor: '#007bff',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  navButtonTextActive: {
    color: '#007bff',
  },
  main: {
    flex: 1,
  },
});

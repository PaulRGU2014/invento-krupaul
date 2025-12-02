import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { LogOut, Package } from 'lucide-react-native';
import { useAuth } from '@/components/auth-context';
import { Dashboard } from '@/components/dashboard';
import { InventoryList } from '@/components/inventory-list';
import { ItemForm } from '@/components/item-form';
import { InventoryItem } from '@/types/inventory';
import { useInventoryApi } from '@/lib/inventory-api';

export default function HomeScreen() {
  const { user, logout, token, loading: authLoading } = useAuth();
  const { fetchInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventoryApi();
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'add'>('dashboard');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPage = useCallback(async (nextPage: number, replace: boolean = false) => {
    if (!token) return;
    setLoadingItems(true);
    setError(null);
    try {
      const res = await fetchInventory(nextPage, 50);
      const data = res?.data || [];
      if (replace) {
        setItems(data);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const merged = [...prev];
          for (const item of data) if (!existingIds.has(item.id)) merged.push(item);
          return merged;
        });
      }
      setHasMore(data.length === 50);
      setPage(nextPage);
    } catch (e: any) {
      setError(e.message || 'Failed to load inventory');
    } finally {
      setLoadingItems(false);
    }
  }, [token, fetchInventory]);

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  const debouncedSetSearch = (text: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearchTerm(text), 300);
  };

  const handleAddItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    try {
      const res = await createInventoryItem(itemData);
      if (res?.success && res.data) {
        setItems(prev => [res.data, ...prev]);
        setActiveView('inventory');
        Alert.alert('Success', 'Item added successfully');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create item');
    }
  };

  const handleUpdateItem = async (updatedItem: InventoryItem) => {
    try {
      const res = await updateInventoryItem(updatedItem.id, {
        name: updatedItem.name,
        category: updatedItem.category,
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        minStock: updatedItem.minStock,
        price: updatedItem.price,
        supplier: updatedItem.supplier,
      });
      if (res?.success && res.data) {
        setItems(prev => prev.map(item => item.id === updatedItem.id ? res.data : item));
        setEditingItem(null);
        setActiveView('inventory');
        Alert.alert('Success', 'Item updated successfully');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await deleteInventoryItem(id);
      if (res?.success) {
        setItems(prev => prev.filter(item => item.id !== id));
        Alert.alert('Success', 'Item deleted successfully');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete item');
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setActiveView('add');
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const hay = (item.name + ' ' + item.supplier + ' ' + item.category).toLowerCase();
    return hay.includes(searchTerm.toLowerCase());
  });

  if (authLoading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Authenticating...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Package color="#007bff" size={24} />
            </View>
            <View style={styles.titleGroup}>
              <Text style={styles.title}>Inventory Manager</Text>
              <Text style={styles.subtitle}>Track and manage your stock</Text>
            </View>
          </View>
          <View style={styles.userSection}>
            <View>
              <Text style={styles.userName}>{user?.name || user?.email || 'User'}</Text>
              {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton} accessibilityLabel="Logout">
              <LogOut color="#6b7280" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.nav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navContent}>
          <TouchableOpacity
            style={[styles.navButton, activeView === 'dashboard' && styles.navButtonActive]}
            onPress={() => { setActiveView('dashboard'); setEditingItem(null); }}
          >
            <Text style={[styles.navButtonText, activeView === 'dashboard' && styles.navButtonTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, activeView === 'inventory' && styles.navButtonActive]}
            onPress={() => { setActiveView('inventory'); setEditingItem(null); }}
          >
            <Text style={[styles.navButtonText, activeView === 'inventory' && styles.navButtonTextActive]}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, activeView === 'add' && styles.navButtonActive]}
            onPress={() => setActiveView('add')}
          >
            <Text style={[styles.navButtonText, activeView === 'add' && styles.navButtonTextActive]}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
          </TouchableOpacity>
        </ScrollView>
        {activeView === 'inventory' && (
          <View style={styles.searchBarWrapper}>
            <TextInput
              placeholder="Search inventory..."
              style={styles.searchInput}
              onChangeText={debouncedSetSearch}
              returnKeyType="search"
            />
          </View>
        )}
      </View>

      <View style={styles.main}>
        {activeView === 'dashboard' && <Dashboard items={items} />}
        {activeView === 'inventory' && (
          <>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => loadPage(1, true)}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <InventoryList
              items={filteredItems}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
            {hasMore && !loadingItems && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={() => loadPage(page + 1)}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
            {loadingItems && (
              <ActivityIndicator style={styles.inlineLoader} size="small" color="#007bff" />
            )}
          </>
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
  container: { flex: 1, backgroundColor: '#f8f9fb' },
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
  headerContent: { gap: 12 },
  logoSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#007bff22', alignItems: 'center', justifyContent: 'center' },
  titleGroup: { flex: 1 },
  title: { fontSize: 20, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280' },
  userSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  userName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  userEmail: { fontSize: 12, color: '#6b7280' },
  logoutButton: { padding: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  nav: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  navContent: { paddingHorizontal: 16, gap: 16 },
  searchBarWrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  navButton: { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  navButtonActive: { borderBottomColor: '#007bff' },
  navButtonText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  navButtonTextActive: { color: '#007bff' },
  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#dc2626', marginBottom: 8, fontSize: 14, fontWeight: '500' },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loadMoreButton: { marginTop: 12, backgroundColor: '#007bff', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  loadMoreText: { color: '#fff', fontWeight: '600' },
  inlineLoader: { marginTop: 12 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fb' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
});

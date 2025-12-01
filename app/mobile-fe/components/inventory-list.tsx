import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Search, Edit2, Trash2, AlertTriangle } from 'lucide-react-native';
import { InventoryItem } from '@/types/inventory';

interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryList({ items, onEdit, onDelete }: InventoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', ...new Set(items.map(item => item.category))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <ScrollView style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrapper}>
        <Search color="#9ca3af" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items or suppliers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Items List */}
      <View style={styles.itemsList}>
        {filteredItems.length === 0 ? (
          <Text style={styles.emptyState}>No items found</Text>
        ) : (
          filteredItems.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  {item.quantity <= item.minStock && (
                    <AlertTriangle color="#dc2626" size={16} />
                  )}
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => onEdit(item)} style={styles.editButton}>
                    <Edit2 color="#007bff" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Delete Item',
                        `Are you sure you want to delete ${item.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) }
                        ]
                      );
                    }}
                    style={styles.deleteButton}
                  >
                    <Trash2 color="#dc2626" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>Category:</Text>
                  <Text style={styles.itemValue}>{item.category}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>Quantity:</Text>
                  <Text style={[
                    styles.itemValue,
                    item.quantity <= item.minStock && styles.lowStock
                  ]}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>Min Stock:</Text>
                  <Text style={styles.itemValue}>{item.minStock} {item.unit}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>Unit Price:</Text>
                  <Text style={styles.itemValue}>${item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>Total Value:</Text>
                  <Text style={styles.itemValue}>${(item.quantity * item.price).toFixed(2)}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>Supplier:</Text>
                  <Text style={styles.itemValue}>{item.supplier}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Items</Text>
          <Text style={styles.summaryValue}>{filteredItems.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>
            ${filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  searchWrapper: {
    position: 'relative',
    padding: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 28,
    top: 28,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  itemsList: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    textAlign: 'center',
    paddingVertical: 48,
    color: '#6b7280',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  itemDetails: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  lowStock: {
    color: '#dc2626',
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
});

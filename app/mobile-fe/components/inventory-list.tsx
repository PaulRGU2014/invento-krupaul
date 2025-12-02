import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react-native';
import { InventoryItem } from '@/types/inventory';
import { Picker } from '@react-native-picker/picker';
import { Theme } from '@/constants/theme';

interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryList({ items, onEdit, onDelete }: InventoryListProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category));
    return ['all', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      if (q) {
        const matches =
          item.name.toLowerCase().includes(q) ||
          (item.supplier || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (category !== 'all' && item.category !== category) return false;
      if (stockFilter === 'low' && item.quantity > item.minStock) return false;
      return true;
    });
  }, [items, search, category, stockFilter]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: Theme.background }]}>
      {/* Filters */}
      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items or supplier..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={category}
            onValueChange={(val) => setCategory(val as any)}
            style={styles.picker}
          >
            {categories.map(cat => (
              <Picker.Item key={cat} label={cat === 'all' ? 'All Categories' : cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.filterRowSmall}>
        <TouchableOpacity
          onPress={() => setStockFilter(prev => (prev === 'all' ? 'low' : 'all'))}
          style={[
            styles.stockButton,
            stockFilter === 'low' && { backgroundColor: Theme.lowStockBg, borderColor: Theme.lowStockBorder },
          ]}
        >
          <Text style={[styles.stockButtonText, stockFilter === 'low' && { color: Theme.danger }]}>
            {stockFilter === 'low' ? 'Showing Low Stock' : 'Show Low Stock'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <View style={styles.itemsList}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyState}>No items found</Text>
        ) : (
          filtered.map(item => (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                item.quantity <= item.minStock && {
                  backgroundColor: Theme.lowStockBg,
                  borderWidth: 1,
                  borderColor: Theme.lowStockBorder,
                },
              ]}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  {item.quantity <= item.minStock && (
                    <AlertTriangle color={Theme.danger} size={16} />
                  )}
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconButton, { backgroundColor: Theme.primaryLight }]}>
                    <Edit2 color={Theme.primary} size={18} />
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
                    style={[styles.iconButton, { backgroundColor: Theme.lowStockBg }]}
                  >
                    <Trash2 color={Theme.danger} size={18} />
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
          <Text style={styles.summaryValue}>{filtered.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>
            ${filtered.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  filterRow: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  filterRowSmall: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 8,
    backgroundColor: Theme.cardBg,
  },
  pickerWrapper: {
    width: 160,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Theme.cardBg,
  },
  picker: {
    height: 44,
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
    backgroundColor: Theme.cardBg,
    borderRadius: Theme.borderRadius,
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
  iconButton: {
    padding: 8,
    borderRadius: 8,
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
    color: Theme.danger,
    fontWeight: '600',
  },
  stockButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.cardBg,
  },
  stockButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  summary: {
    backgroundColor: Theme.cardBg,
    borderRadius: Theme.borderRadius,
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

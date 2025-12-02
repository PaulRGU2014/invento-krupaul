import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react-native';
import { InventoryItem } from '@/types/inventory';
import { Theme } from '@/constants/theme';

interface DashboardProps {
  items: InventoryItem[];
}

export function Dashboard({ items }: DashboardProps) {
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.quantity <= item.minStock);
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const categories = [...new Set(items.map(item => item.category))];

  const categoryData = categories.map(category => {
    const categoryItems = items.filter(item => item.category === category);
    return {
      name: category,
      count: categoryItems.length,
      value: categoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    };
  }).sort((a, b) => b.value - a.value);

  return (
    <ScrollView style={styles.container}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Total Items</Text>
              <Text style={styles.statValue}>{totalItems}</Text>
            </View>
            <View style={[styles.statIcon, styles.blueIcon]}>
              <Package color={Theme.primary} size={24} />
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Low Stock Alerts</Text>
              <Text style={styles.statValue}>{lowStockItems.length}</Text>
            </View>
            <View style={[styles.statIcon, styles.redIcon]}>
              <AlertTriangle color={Theme.danger} size={24} />
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Total Value</Text>
              <Text style={styles.statValue}>${totalValue.toFixed(2)}</Text>
            </View>
            <View style={[styles.statIcon, styles.greenIcon]}>
              <DollarSign color="#059669" size={24} />
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Categories</Text>
              <Text style={styles.statValue}>{categories.length}</Text>
            </View>
            <View style={[styles.statIcon, styles.purpleIcon]}>
              <TrendingUp color="#9333ea" size={24} />
            </View>
          </View>
        </View>
      </View>

      {/* Low Stock Alerts */}
      <View style={[styles.card, { backgroundColor: Theme.cardBg, borderRadius: Theme.borderRadius }]}>
        <Text style={styles.cardTitle}>Low Stock Alerts</Text>
        {lowStockItems.length === 0 ? (
          <Text style={styles.emptyState}>No items running low on stock</Text>
        ) : (
          <View style={styles.alertList}>
            {lowStockItems.map(item => (
              <View key={item.id} style={[styles.alertItem, { backgroundColor: Theme.lowStockBg, borderColor: Theme.lowStockBorder }]}>
                <View style={styles.alertLeft}>
                  <AlertTriangle color={Theme.danger} size={20} />
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertName}>{item.name}</Text>
                    <Text style={styles.alertCategory}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.alertRight}>
                  <Text style={[styles.alertQuantity, { color: Theme.danger }]}>{item.quantity} {item.unit}</Text>
                  <Text style={styles.alertMin}>Min: {item.minStock}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Category Breakdown */}
      <View style={[styles.card, { backgroundColor: Theme.cardBg, borderRadius: Theme.borderRadius }]}>
        <Text style={styles.cardTitle}>Inventory by Category</Text>
        <View style={styles.categoryList}>
          {categoryData.map(cat => (
            <View key={cat.name} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryValue}>${cat.value.toFixed(2)}</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${totalValue > 0 ? (cat.value / totalValue) * 100 : 0}%` }
                  ]}
                />
              </View>
              <Text style={styles.categoryCount}>{cat.count} items</Text>
            </View>
          ))}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: Theme.cardBg,
    borderRadius: Theme.borderRadius,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    minWidth: '45%',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  statIcon: {
    padding: 12,
    borderRadius: 8,
  },
  blueIcon: {
    backgroundColor: Theme.primaryLight,
  },
  redIcon: {
    backgroundColor: Theme.lowStockBg,
  },
  greenIcon: {
    backgroundColor: '#d1fae5',
  },
  purpleIcon: {
    backgroundColor: '#e9d5ff',
  },
  card: {
    backgroundColor: Theme.cardBg,
    borderRadius: Theme.borderRadius,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    textAlign: 'center',
    paddingVertical: 32,
    color: '#6b7280',
  },
  alertList: {
    gap: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Theme.lowStockBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.lowStockBorder,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontWeight: '500',
    color: '#111827',
  },
  alertCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  alertRight: {
    alignItems: 'flex-end',
  },
  alertQuantity: {
    fontWeight: '600',
    color: Theme.danger,
  },
  alertMin: {
    fontSize: 12,
    color: '#9ca3af',
  },
  categoryList: {
    gap: 16,
  },
  categoryItem: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontWeight: '500',
    color: '#111827',
  },
  categoryValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Theme.border,
    borderRadius: 999,
  },
  progressFill: {
    height: 8,
    backgroundColor: Theme.primary,
    borderRadius: 999,
  },
  categoryCount: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

'use client';

import { useEffect, useState } from 'react';
import { InventoryItem } from '@/types/inventory';
import { Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import styles from './inventory-list.module.scss';
import { useI18n } from '@/lib/i18n';

interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onInlineUpdate?: (id: string, updates: Pick<InventoryItem, 'quantity' | 'price'>) => Promise<void> | void;
}

export function InventoryList({ items, onEdit, onDelete, onInlineUpdate }: InventoryListProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');
  const [inlineValues, setInlineValues] = useState<Record<string, { quantity: number; price: number }>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});

  // Keep inline values aligned with incoming items while preserving in-progress edits
  useEffect(() => {
    setInlineValues(prev => {
      const next: Record<string, { quantity: number; price: number }> = {};
      items.forEach(item => {
        next[item.id] = {
          quantity: prev[item.id]?.quantity ?? item.quantity,
          price: prev[item.id]?.price ?? item.price,
        };
      });
      return next;
    });
  }, [items]);

  const categories = ['all', ...new Set(items.map(item => item.category))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || (stockFilter === 'low' && item.quantity <= item.minStock);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleInlineChange = (id: string, field: 'quantity' | 'price', value: number) => {
    setInlineValues(prev => ({
      ...prev,
      [id]: {
        quantity: field === 'quantity' ? value : prev[id]?.quantity ?? items.find(item => item.id === id)?.quantity ?? 0,
        price: field === 'price' ? value : prev[id]?.price ?? items.find(item => item.id === id)?.price ?? 0,
      },
    }));
  };

  const handleInlineSave = async (item: InventoryItem) => {
    if (!onInlineUpdate) return;

    const current = inlineValues[item.id];
    if (!current) return;

    const hasChanges = current.quantity !== item.quantity || current.price !== item.price;
    if (!hasChanges) return;

    setSavingIds(prev => ({ ...prev, [item.id]: true }));
    try {
      await onInlineUpdate(item.id, { quantity: current.quantity, price: current.price });
    } catch (error) {
      // Revert to server values on failure to keep UI consistent
      setInlineValues(prev => ({
        ...prev,
        [item.id]: { quantity: item.quantity, price: item.price },
      }));
      window.alert('Failed to update item. Please try again.');
      console.error('Inline update failed', error);
    } finally {
      setSavingIds(prev => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder={t('inventory.filters.searchPlaceholder', 'Search items or suppliers...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.select}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? t('inventory.filters.allCategories', 'All Categories') : cat}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'low')}
            className={styles.select}
          >
            <option value="all">{t('inventory.filters.allStock', 'All Stock Levels')}</option>
            <option value="low">{t('inventory.filters.lowStockOnly', 'Low Stock Only')}</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>{t('inventory.table.item', 'Item')}</th>
                <th>{t('inventory.table.category', 'Category')}</th>
                <th>{t('inventory.table.quantity', 'Quantity')}</th>
                <th>{t('inventory.table.minStock', 'Min Stock')}</th>
                <th>{t('inventory.table.unitPrice', 'Unit Price')}</th>
                <th>{t('inventory.table.totalValue', 'Total Value')}</th>
                <th>{t('inventory.table.supplier', 'Supplier')}</th>
                <th>{t('inventory.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    {t('inventory.table.empty', 'No items found matching your filters')}
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const inlineValue = inlineValues[item.id] ?? { quantity: item.quantity, price: item.price };
                  const isSaving = !!savingIds[item.id];
                  const isLowStock = inlineValue.quantity <= item.minStock;

                  return (
                    <tr key={item.id}>
                      <td className={styles.itemName}>
                        {isLowStock && (
                          <AlertTriangle className={styles.alertIcon} size={16} />
                        )}
                        <span>{item.name}</span>
                      </td>
                      <td className={styles.category}>{item.category}</td>
                      <td className={`${styles.quantity}`}>
                        <div className={styles.inlineField}>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={inlineValue.quantity}
                            onChange={(e) => handleInlineChange(item.id, 'quantity', Math.max(0, Number(e.target.value) || 0))}
                            onBlur={() => handleInlineSave(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineSave(item);
                              }
                            }}
                            disabled={isSaving}
                            className={`${styles.inlineInput} ${isSaving ? styles.saving : ''} ${isLowStock ? styles.lowStock : ''}`}
                            aria-label={`Quantity for ${item.name}`}
                          />
                          <span className={styles.unitLabel}>{item.unit}</span>
                        </div>
                      </td>
                      <td className={styles.minStock}>{item.minStock} {item.unit}</td>
                      <td className={styles.price}>
                        <div className={styles.inlineField}>
                          <span className={styles.currencyPrefix}>$</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={inlineValue.price}
                            onChange={(e) => handleInlineChange(item.id, 'price', Math.max(0, Number(e.target.value) || 0))}
                            onBlur={() => handleInlineSave(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineSave(item);
                              }
                            }}
                            disabled={isSaving}
                            className={`${styles.inlineInput} ${styles.priceInput} ${isSaving ? styles.saving : ''}`}
                            aria-label={`Unit price for ${item.name}`}
                          />
                        </div>
                      </td>
                      <td className={styles.price}>${(inlineValue.quantity * inlineValue.price).toFixed(2)}</td>
                      <td className={styles.supplier}>{item.supplier}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            onClick={() => onEdit(item)}
                            className={styles.editButton}
                            title={t('inventory.table.edit', 'Edit item')}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t('inventory.table.confirmDelete', `Are you sure you want to delete {name}?`).replace('{name}', item.name))) {
                                onDelete(item.id);
                              }
                            }}
                            className={styles.deleteButton}
                            title={t('inventory.table.delete', 'Delete item')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <p>{t('inventory.summary.showing', 'Showing Items')}</p>
            <p>{filteredItems.length}</p>
          </div>
          <div className={styles.summaryItem}>
            <p>{t('inventory.summary.totalQty', 'Total Quantity')}</p>
            <p>{filteredItems.reduce((sum, item) => sum + item.quantity, 0)} {t('inventory.summary.units', 'units')}</p>
          </div>
          <div className={styles.summaryItem}>
            <p>{t('inventory.summary.totalValue', 'Total Value')}</p>
            <p>${filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

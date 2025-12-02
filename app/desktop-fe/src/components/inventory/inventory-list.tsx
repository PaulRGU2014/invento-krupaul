'use client';

import { useState } from 'react';
import { InventoryItem } from '@/types/inventory';
import { Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import styles from './inventory-list.module.scss';

interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryList({ items, onEdit, onDelete }: InventoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');

  const categories = ['all', ...new Set(items.map(item => item.category))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || (stockFilter === 'low' && item.quantity <= item.minStock);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search items or suppliers..."
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
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'low')}
            className={styles.select}
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock Only</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Min Stock</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    No items found matching your filters
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id}>
                    <td className={styles.itemName}>
                      {item.quantity <= item.minStock && (
                        <AlertTriangle className={styles.alertIcon} size={16} />
                      )}
                      <span>{item.name}</span>
                    </td>
                    <td className={styles.category}>{item.category}</td>
                    <td className={`${styles.quantity} ${item.quantity <= item.minStock ? styles.lowStock : ''}`}>
                      {item.quantity} {item.unit}
                    </td>
                    <td className={styles.minStock}>{item.minStock} {item.unit}</td>
                    <td className={styles.price}>${item.price.toFixed(2)}</td>
                    <td className={styles.price}>${(item.quantity * item.price).toFixed(2)}</td>
                    <td className={styles.supplier}>{item.supplier}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => onEdit(item)}
                          className={styles.editButton}
                          title="Edit item"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                              onDelete(item.id);
                            }
                          }}
                          className={styles.deleteButton}
                          title="Delete item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <p>Showing Items</p>
            <p>{filteredItems.length}</p>
          </div>
          <div className={styles.summaryItem}>
            <p>Total Quantity</p>
            <p>{filteredItems.reduce((sum, item) => sum + item.quantity, 0)} units</p>
          </div>
          <div className={styles.summaryItem}>
            <p>Total Value</p>
            <p>${filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

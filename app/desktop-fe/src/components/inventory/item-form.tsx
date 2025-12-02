'use client';

import { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/inventory';
import { X } from 'lucide-react';
import styles from './item-form.module.scss';

interface ItemFormProps {
  item: InventoryItem | null;
  onSubmit: (item: any) => void;
  onCancel: () => void;
}

export function ItemForm({ item, onSubmit, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: 'kg',
    minStock: 0,
    price: 0,
    supplier: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        price: item.price,
        supplier: item.supplier,
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      onSubmit({ ...item, ...formData });
    } else {
      onSubmit(formData);
    }
    setFormData({
      name: '',
      category: '',
      quantity: 0,
      unit: 'kg',
      minStock: 0,
      price: 0,
      supplier: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['quantity', 'minStock', 'price'].includes(name) ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>{item ? 'Edit Item' : 'Add New Item'}</h2>
          {item && (
            <button onClick={onCancel} className={styles.closeButton}>
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Item Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Tomatoes"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Vegetables"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="unit">Unit *</label>
              <select
                id="unit"
                name="unit"
                required
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="liters">Liters</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pieces">Pieces</option>
                <option value="boxes">Boxes</option>
                <option value="cans">Cans</option>
                <option value="bottles">Bottles</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="minStock">Minimum Stock Level *</label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                required
                min="0"
                step="0.01"
                value={formData.minStock}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="price">Unit Price ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="supplier">Supplier *</label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                required
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g., Fresh Farms Co."
              />
            </div>
          </div>

          <div className={styles.formActions}>
            {item && (
              <button
                type="button"
                onClick={onCancel}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            )}
            <button type="submit" className={styles.submitButton}>
              {item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>

      {!item && (
        <div className={styles.tip}>
          <p>
            <span>Tip:</span> Set the minimum stock level to get alerts when inventory runs low. 
            This helps you reorder items before they run out.
          </p>
        </div>
      )}
    </div>
  );
}

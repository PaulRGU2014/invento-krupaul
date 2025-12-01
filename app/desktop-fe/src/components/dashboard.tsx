import { InventoryItem } from '@/types/inventory';
import { Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import styles from './dashboard.module.scss';

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
    <div className={styles.container}>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <p>Total Items</p>
              <h3>{totalItems}</h3>
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <p>Low Stock Alerts</p>
              <h3>{lowStockItems.length}</h3>
            </div>
            <div className={`${styles.statIcon} ${styles.red}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <p>Total Value</p>
              <h3>${totalValue.toFixed(2)}</h3>
            </div>
            <div className={`${styles.statIcon} ${styles.green}`}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <p>Categories</p>
              <h3>{categories.length}</h3>
            </div>
            <div className={`${styles.statIcon} ${styles.purple}`}>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.gridTwo}>
        {/* Low Stock Alerts */}
        <div className={styles.card}>
          <h2>Low Stock Alerts</h2>
          {lowStockItems.length === 0 ? (
            <p className={styles.emptyState}>No items running low on stock</p>
          ) : (
            <div className={styles.alertList}>
              {lowStockItems.map(item => (
                <div key={item.id} className={styles.alertItem}>
                  <div className={styles.alertLeft}>
                    <div className={styles.alertIcon}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className={styles.alertInfo}>
                      <p>{item.name}</p>
                      <p>{item.category}</p>
                    </div>
                  </div>
                  <div className={styles.alertRight}>
                    <p>{item.quantity} {item.unit}</p>
                    <p>Min: {item.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className={styles.card}>
          <h2>Inventory by Category</h2>
          <div className={styles.categoryList}>
            {categoryData.map(cat => (
              <div key={cat.name} className={styles.categoryItem}>
                <div className={styles.categoryHeader}>
                  <span>{cat.name}</span>
                  <span>${cat.value.toFixed(2)}</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(cat.value / totalValue) * 100}%` }}
                  />
                </div>
                <p className={styles.categoryCount}>{cat.count} items</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className={styles.card}>
        <h2>Recently Updated</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Value</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {items
                .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                .slice(0, 5)
                .map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>${(item.quantity * item.price).toFixed(2)}</td>
                    <td>
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

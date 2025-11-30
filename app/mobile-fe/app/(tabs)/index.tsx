import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/components/auth-context';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Manager</Text>
        <View style={styles.userRow}>
          <Text style={styles.username}>{user?.name || user?.email || 'Guest'}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Dashboard','Dashboard view coming soon')}> 
          <Text style={styles.actionText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Inventory','Inventory list coming soon')}>
          <Text style={styles.actionText}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Add Item','Item form coming soon')}>
          <Text style={styles.actionText}>Add Item</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeHeading}>Welcome{user?.name ? `, ${user.name}` : ''}!</Text>
        <Text style={styles.welcomeBody}>This is your home page. We’ll hook up Dashboard, Inventory, and ItemForm next based on your Figma components.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  username: { fontSize: 16, fontWeight: '500' },
  logoutButton: { backgroundColor: '#eee', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  logoutText: { fontSize: 14, color: '#333' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionButton: { flex: 1, backgroundColor: '#007bff', padding: 14, marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '600' },
  welcomeSection: { gap: 8 },
  welcomeHeading: { fontSize: 20, fontWeight: '600' },
  welcomeBody: { fontSize: 14, lineHeight: 20, color: '#444' },
});

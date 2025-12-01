import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { InventoryItem } from '@/types/inventory';
import { Picker } from '@react-native-picker/picker';

interface ItemFormProps {
  item: InventoryItem | null;
  onSubmit: (item: any) => void;
  onCancel: () => void;
}

export function ItemForm({ item, onSubmit, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '0',
    unit: 'kg',
    minStock: '0',
    price: '0',
    supplier: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        minStock: item.minStock.toString(),
        price: item.price.toString(),
        supplier: item.supplier,
      });
    }
  }, [item]);

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity) || 0,
      unit: formData.unit,
      minStock: parseFloat(formData.minStock) || 0,
      price: parseFloat(formData.price) || 0,
      supplier: formData.supplier,
    };

    if (item) {
      onSubmit({ ...item, ...data });
    } else {
      onSubmit(data);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{item ? 'Edit Item' : 'Add New Item'}</Text>
          {item && (
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <X color="#9ca3af" size={24} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="e.g., Tomatoes"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(value) => setFormData(prev => ({ ...prev, category: value }))}
              placeholder="e.g., Vegetables"
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(value) => setFormData(prev => ({ ...prev, quantity: value }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Unit *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Kilograms (kg)" value="kg" />
                  <Picker.Item label="Grams (g)" value="g" />
                  <Picker.Item label="Liters" value="liters" />
                  <Picker.Item label="Milliliters (ml)" value="ml" />
                  <Picker.Item label="Pieces" value="pieces" />
                  <Picker.Item label="Boxes" value="boxes" />
                  <Picker.Item label="Cans" value="cans" />
                  <Picker.Item label="Bottles" value="bottles" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Min Stock *</Text>
              <TextInput
                style={styles.input}
                value={formData.minStock}
                onChangeText={(value) => setFormData(prev => ({ ...prev, minStock: value }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={styles.label}>Unit Price ($) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(value) => setFormData(prev => ({ ...prev, price: value }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Supplier *</Text>
            <TextInput
              style={styles.input}
              value={formData.supplier}
              onChangeText={(value) => setFormData(prev => ({ ...prev, supplier: value }))}
              placeholder="e.g., Fresh Farms Co."
            />
          </View>

          <View style={styles.formActions}>
            {item && (
              <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>
                {item ? 'Update Item' : 'Add Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!item && (
          <View style={styles.tip}>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Tip:</Text> Set the minimum stock level to get alerts 
              when inventory runs low. This helps you reorder items before they run out.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007bff',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  tip: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#1e3a8a',
  },
  tipBold: {
    fontWeight: '500',
  },
});

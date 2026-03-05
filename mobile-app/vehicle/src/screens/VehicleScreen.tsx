import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export default function VehicleScreen() {
  const [vehicle, setVehicle] = useState({ make: 'Toyota', model: 'Camry', year: '2022', vin: 'ABC123XYZ' });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Management</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Make</Text>
        <Text style={styles.value}>{vehicle.make}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Model</Text>
        <Text style={styles.value}>{vehicle.model}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Year</Text>
        <Text style={styles.value}>{vehicle.year}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>VIN</Text>
        <Text style={styles.value}>{vehicle.vin}</Text>
      </View>
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Edit Vehicle</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
        <Text style={styles.buttonText}>Add New Vehicle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  label: { fontSize: 12, color: '#666', marginBottom: 5 },
  value: { fontSize: 16, fontWeight: '600' },
  button: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#4CAF50' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' }
});
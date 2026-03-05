import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export default function AlertsScreen() {
  const [alerts] = useState([
    { id: '1', type: 'warning', message: 'Engine temperature high', time: '2 hours ago' },
    { id: '2', type: 'info', message: 'Maintenance due in 500 miles', time: '1 day ago' },
    { id: '3', type: 'critical', message: 'Brake pad wear detected', time: '3 days ago' }
  ]);

  const getAlertColor = (type: string) => {
    switch(type) {
      case 'critical': return '#F44336';
      case 'warning': return '#FFC107';
      default: return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alerts & Notifications</Text>
      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.alertCard, { borderLeftColor: getAlertColor(item.type) }]}>
            <Text style={styles.alertMessage}>{item.message}</Text>
            <Text style={styles.alertTime}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  alertCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4 },
  alertMessage: { fontSize: 16, fontWeight: '600' },
  alertTime: { fontSize: 12, color: '#666', marginTop: 5 }
});
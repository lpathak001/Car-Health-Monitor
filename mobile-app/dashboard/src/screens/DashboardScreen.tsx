import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import HealthScoreGauge from '../components/HealthScoreGauge';
import SensorChart from '../components/SensorChart';

export default function DashboardScreen() {
  const [healthScore, setHealthScore] = useState(85);
  const [sensorData, setSensorData] = useState([65, 70, 75, 80, 85]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Vehicle Health Dashboard</Text>
      <HealthScoreGauge score={healthScore} />
      <SensorChart data={sensorData} />
      <View style={styles.statusCard}>
        <Text style={styles.statusText}>Status: Good</Text>
        <Text style={styles.detailText}>Last updated: Just now</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  statusCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginTop: 20 },
  statusText: { fontSize: 18, fontWeight: '600' },
  detailText: { fontSize: 14, color: '#666', marginTop: 5 }
});
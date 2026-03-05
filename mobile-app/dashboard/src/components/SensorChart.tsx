import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface Props { data: number[]; }

export default function SensorChart({ data }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensor Trends</Text>
      <View style={styles.chart}>
        {data.map((value, index) => (
          <View key={index} style={[styles.bar, { height: value * 2 }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginTop: 10 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  chart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 200 },
  bar: { width: 40, backgroundColor: '#2196F3', borderRadius: 5 }
});
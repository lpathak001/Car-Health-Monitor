import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props { score: number; }

export default function HealthScoreGauge({ score }: Props) {
  const getColor = () => score >= 80 ? '#4CAF50' : score >= 60 ? '#FFC107' : '#F44336';
  
  return (
    <View style={styles.container}>
      <View style={[styles.gauge, { backgroundColor: getColor() }]}>
        <Text style={styles.score}>{score}</Text>
      </View>
      <Text style={styles.label}>Health Score</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 20 },
  gauge: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  score: { fontSize: 36, fontWeight: 'bold', color: 'white' },
  label: { marginTop: 10, fontSize: 16, color: '#666' }
});
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      
      <View style={styles.card}>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@example.com</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.dangerButton]}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 20, alignItems: 'center' },
  name: { fontSize: 20, fontWeight: 'bold' },
  email: { fontSize: 14, color: '#666', marginTop: 5 },
  section: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  settingLabel: { fontSize: 16 },
  button: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  dangerButton: { backgroundColor: '#F44336' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' }
});
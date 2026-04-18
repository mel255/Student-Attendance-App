import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AttendanceHub() {
  // Logic from our previous steps (GPS/Biometrics) would stay integrated here
  const inRange = true; // Example state

  return (
    <ScrollView style={styles.container}>
      {/* 1. Status Indicator */}
      <View style={[styles.statusCard, { backgroundColor: inRange ? '#E8F5E9' : '#FFEBEE' }]}>
        <Ionicons 
          name={inRange ? "location" : "location-outline"} 
          size={30} 
          color={inRange ? "#2E7D32" : "#C62828"} 
        />
        <Text style={[styles.statusText, { color: inRange ? "#2E7D32" : "#C62828" }]}>
          {inRange ? "Within Class Zone" : "Outside Class Zone"}
        </Text>
      </View>

      {/* 2. Course Details Card */}
      <View style={styles.courseCard}>
        <Text style={styles.label}>Current Session</Text>
        <Text style={styles.unitCode}>BIT 2301: Cloud Computing</Text>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Dr. Collins</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={styles.detailText}>ELB 212 (Computer Lab)</Text>
        </View>
      </View>

      {/* 3. Central Check-in Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.mainButton, { opacity: inRange ? 1 : 0.5 }]}
          disabled={!inRange}
        >
          <Text style={styles.buttonText}>SIGN ATTENDANCE</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Biometric verification will follow</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 60 },
  statusCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 15, marginBottom: 20 },
  statusText: { marginLeft: 10, fontWeight: 'bold', fontSize: 16 },
  courseCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2, marginBottom: 30 },
  label: { color: '#999', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  unitCode: { fontSize: 20, fontWeight: 'bold', color: '#333', marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  detailText: { marginLeft: 8, color: '#666' },
  buttonContainer: { alignItems: 'center', marginTop: 20 },
  mainButton: { backgroundColor: '#1A237E', width: 250, height: 250, borderRadius: 125, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 20, textAlign: 'center' },
  hint: { marginTop: 15, color: '#888', fontStyle: 'italic' }
});
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EntryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Notch & Status Bar Simulation for Mockup Look */}
      <View style={styles.statusBar} />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={40} color="#185FA5" />
          </View>
          <Text style={styles.brandName}>GPS Attendance</Text>
          <Text style={styles.tagline}>JKUAT Smart Classroom System</Text>
        </View>

        <View style={styles.buttonGroup}>
          <Text style={styles.label}>Continue as:</Text>

          {/* Lecturer Portal Button */}
          <TouchableOpacity 
            style={styles.cardBtn} 
            onPress={() => router.push('/login')} // Redirects to Login, then Lecturer Portal
          >
            <View style={styles.iconBgBlue}>
              <Ionicons name="school" size={24} color="#185FA5" />
            </View>
            <View style={styles.btnTextContent}>
              <Text style={styles.btnTitle}>Lecturer Portal</Text>
              <Text style={styles.btnSub}>Start sessions & view reports</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          {/* Student Portal Button */}
          <TouchableOpacity 
            style={styles.cardBtn} 
            onPress={() => router.push('/login')} // Redirects to Login, then Attendance
          >
            <View style={styles.iconBgGreen}>
              <Ionicons name="person" size={24} color="#0F6E56" />
            </View>
            <View style={styles.btnTextContent}>
              <Text style={styles.btnTitle}>Student Portal</Text>
              <Text style={styles.btnSub}>Mark attendance & see history</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 JKUAT Mobile Computing Project</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  statusBar: { height: 44, backgroundColor: 'transparent' },
  content: { flex: 1, paddingHorizontal: 25, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  iconCircle: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#E6F1FB', justifyContent: 'center', 
    alignItems: 'center', marginBottom: 15 
  },
  brandName: { fontSize: 24, fontWeight: '700', color: '#333' },
  tagline: { fontSize: 13, color: '#999', marginTop: 4 },
  buttonGroup: { width: '100%' },
  label: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 15, textTransform: 'uppercase' },
  cardBtn: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F8F9FA', padding: 18, 
    borderRadius: 15, marginBottom: 15,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  iconBgBlue: { width: 45, height: 45, borderRadius: 10, backgroundColor: '#E6F1FB', justifyContent: 'center', alignItems: 'center' },
  iconBgGreen: { width: 45, height: 45, borderRadius: 10, backgroundColor: '#E1F5EE', justifyContent: 'center', alignItems: 'center' },
  btnTextContent: { flex: 1, marginLeft: 15 },
  btnTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  btnSub: { fontSize: 11, color: '#777', marginTop: 2 },
  footer: { paddingBottom: 30, alignItems: 'center' },
  footerText: { fontSize: 10, color: '#CCC' }
});
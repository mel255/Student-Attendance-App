import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LoginScreen() {
  const [studentId, setStudentId] = useState('');
  
  const handleBiometricLogin = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return Alert.alert("Error", "Biometrics not supported");

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login with Biometrics',
    });

    if (result.success) {
      Alert.alert("Welcome", "Authenticated successfully!");
      // Navigate to Dashboard here
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Ionicons name="school" size={80} color="#1A237E" />
        <Text style={styles.title}>AttendanceSystem</Text>
        <Text style={styles.subtitle}>JKUAT Student Portal</Text>
      </View>

      <View style={styles.inputSection}>
        <TextInput 
          style={styles.input} 
          placeholder="Student ID (e.g. SCT211...)" 
          onChangeText={setStudentId}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          secureTextEntry 
        />
        
        <TouchableOpacity style={styles.loginBtn}>
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBiometricLogin} style={styles.bioBtn}>
          <Ionicons name="finger-print" size={40} color="#2E7D32" />
          <Text style={styles.bioText}>Use Biometrics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30, justifyContent: 'center' },
  headerArea: { alignItems: 'center', marginBottom: 50 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A237E', marginTop: 10 },
  subtitle: { color: '#666', fontSize: 16 },
  inputSection: { width: '100%' },
  input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  loginBtn: { backgroundColor: '#1A237E', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  bioBtn: { marginTop: 30, alignItems: 'center' },
  bioText: { color: '#2E7D32', marginTop: 5, fontWeight: '600' }
});
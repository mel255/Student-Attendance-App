import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../../supabase'; 

export default function AttendanceScreen() {
  const [regNumber, setRegNumber] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);

  // Set your current coordinates here to test!
  const CLASS_LAT = -1.099966; 
  const CLASS_LON = 37.007234;
  const RADIUS = 100; 

  const handleSignAttendance = async () => {
    if (!regNumber || !className) {
      Alert.alert("Input Required", "Please enter your Reg Number and Class Name.");
      return;
    }

    setLoading(true);

    // 1. GPS Check
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Error", "GPS is required.");
      setLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const dist = calculateDistance(location.coords.latitude, location.coords.longitude, CLASS_LAT, CLASS_LON);

    if (dist > RADIUS) {
      Alert.alert("Out of Range", `You are ${Math.round(dist)}m away from class.`);
      setLoading(false);
      return;
    }

    // 2. Biometric Check (Prevents Proxy Sign-ins)
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify identity to sign attendance',
    });

    if (!auth.success) {
      Alert.alert("Failed", "Authentication required.");
      setLoading(false);
      return;
    }

    // 3. Database Save (Stores student, class, and log info)
    const { error } = await supabase
      .from('attendance')
      .insert([{ 
        registration_number: regNumber, 
        class_name: className, 
        status: 'Present', 
        verified: true 
      }]);

    if (error) {
      Alert.alert("Database Error", error.message);
    } else {
      Alert.alert("Success", "Attendance logged for " + className);
      setRegNumber('');
      setClassName('');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Class Check-In</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Registration Number (e.g., ENS222...)" 
        value={regNumber}
        onChangeText={setRegNumber}
      />

      <TextInput 
        style={styles.input} 
        placeholder="Class Name (e.g., Mobile Computing)" 
        value={className}
        onChangeText={setClassName}
      />

      <TouchableOpacity 
        style={[styles.button, loading && { backgroundColor: '#ccc' }]} 
        onPress={handleSignAttendance}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Verifying..." : "Sign Attendance"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function calculateDistance(lat1: any, lon1: any, lat2: any, lon2: any) {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  input: { width: '100%', height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },
  button: { backgroundColor: '#007AFF', padding: 20, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
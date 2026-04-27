import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { supabase } from '@/supabase';

export default function AttendanceHub() {
  const [inRange, setInRange] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Check if Student is in the right GPS coordinates
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      
      // JKUAT Computer Lab Mock Coordinates (Replace with real ones)
      const labLat = -1.099966; 
      const labLon = 37.007234;
      
      const distance = Math.sqrt(
        Math.pow(location.coords.latitude - labLat, 2) + 
        Math.pow(location.coords.longitude - labLon, 2)
      );

      // Roughly within 50-100 meters
      if (distance < 0.001) setInRange(true);
    })();
  }, []);

  // 2. The Actual Sign-In Logic
  const handleSignAttendance = async () => {
  try {
    // 1. Get the current student's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert("Error", "Please login first");

    // 2. Look for the active session (Started by the lecturer)
    const { data: session, error: sError } = await supabase
      .from('sessions')
      .select('*')
      .eq('course_id', 'BIT 2301')
      .eq('is_active', true)
      .single();

    if (!session) return Alert.alert("No Session", "Lecturer has not started the class yet.");

    // 3. Get Student Location
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Permission denied");
    
    let location = await Location.getCurrentPositionAsync({});

    // 4. Record attendance
    const { error } = await supabase.from('attendance').insert([{
      student_id: user.id,
      session_id: session.id, // Linking to the lecturer's session
      course_id: 'BIT 2301',
      device_id: `${Device.brand}-${Device.modelName}`,
      status: 'verified'
    }]);

    if (error) throw error;
    Alert.alert("Success", "Attendance Signed Successfully!");

  } catch (err: any) {
    Alert.alert("Failed", err.message);
  }
};

  return (
    <ScrollView style={styles.container}>
      {/* ... Your Existing Status Card ... */}
      <View style={[styles.statusCard, { backgroundColor: inRange ? '#E8F5E9' : '#FFEBEE' }]}>
         <Ionicons name={inRange ? "location" : "location-outline"} size={30} color={inRange ? "#2E7D32" : "#C62828"} />
         <Text style={[styles.statusText, { color: inRange ? "#2E7D32" : "#C62828" }]}>
           {inRange ? "Within Class Zone" : "Outside Class Zone"}
         </Text>
      </View>

      {/* ... Your Existing Course Details ... */}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.mainButton, { opacity: inRange ? 1 : 0.5 }]}
          disabled={!inRange || loading}
          onPress={handleSignAttendance}
        >
          <Text style={styles.buttonText}>{loading ? "VERIFYING..." : "SIGN ATTENDANCE"}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Biometric verification will follow</Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    padding: 20 
  },
  statusCard: { 
    backgroundColor: '#E8F5E9', 
    padding: 15, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  statusText: { 
    color: '#2E7D32', 
    fontWeight: 'bold', 
    marginLeft: 10 
  },
  sessionCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 15, 
    elevation: 2, 
    marginBottom: 30 
  },
  unitCode: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  lecturerName: { 
    color: '#666', 
    marginTop: 5 
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10 
  },
  locationText: { 
    color: '#888', 
    marginLeft: 5 
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40
  },
  mainButton: { 
    backgroundColor: '#1A237E', 
    width: 250, 
    height: 250, 
    borderRadius: 125, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  hint: { // This fixes the specific error in your last photo
    textAlign: 'center', 
    color: '#888', 
    marginTop: 20, 
    fontStyle: 'italic' 
  }
});
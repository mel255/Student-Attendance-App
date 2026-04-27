import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, ScrollView, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../supabase';

export default function StudentPortal() {
  const [regNumber, setRegNumber] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [inRange, setInRange] = useState(false);
  const [isSessionLive, setIsSessionLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // JKUAT Coordinates (Kept in code to avoid DB "lat not found" errors)
  const TARGET_LAT = -1.099966; 
  const TARGET_LON = 37.007234; 

  useEffect(() => {
    startLocationTracking();
    checkSessionAndHistory();
    const interval = setInterval(checkSessionAndHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkSessionAndHistory = async () => {
    // FETCH SESSION: Strictly selecting ONLY is_active to avoid ghost column errors
    const { data: session } = await supabase
      .from('sessions')
      .select('is_active') 
      .eq('course_code', 'SCT211') 
      .single();
    
    if (session) setIsSessionLive(session.is_active);

    // FETCH HISTORY
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: logs } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .order('marked_at', { ascending: false });
      if (logs) setHistory(logs);
    }
  };

  const startLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 1 }, (loc) => {
      const d = calculateDistance(loc.coords.latitude, loc.coords.longitude, TARGET_LAT, TARGET_LON);
      setDistance(d);
      setInRange(d <= 150); // Student must be within 150m of the target
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleMarkAttendance = async () => {
    if (!regNumber.trim()) return Alert.alert("Required", "Enter Registration Number");
    setLoading(true);
    try {
      // 1. Biometric Check
      const bio = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verify Identity' });
      if (!bio.success) throw new Error("Security check failed");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in again");

      // 2. Update Profile (Upsert)
      await supabase.from('profiles').upsert({ 
        id: user.id, 
        reg_number: regNumber, 
        full_name: 'Student ' + regNumber.split('/')[0] 
      });

      // 3. Log Attendance
      const { error } = await supabase.from('attendance').insert([{ 
        student_id: user.id, 
        status: 'Present' 
      }]);

      if (error) throw error;

      Alert.alert("Success", "Attendance Signed!");
      checkSessionAndHistory();
    } catch (err: any) { 
      Alert.alert("Error", err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <Text style={styles.header}>Student Portal</Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBox, { backgroundColor: isSessionLive ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={{ color: isSessionLive ? '#2E7D32' : '#C62828', fontWeight: 'bold' }}>
              {isSessionLive ? "● SESSION LIVE" : "○ SESSION CLOSED"}
            </Text>
          </View>
          <View style={[styles.statusBox, { backgroundColor: inRange ? '#E3F2FD' : '#FFF3E0' }]}>
            <Text style={{ color: inRange ? '#1565C0' : '#EF6C00', fontWeight: 'bold' }}>
              {inRange ? "IN RANGE" : "OUT OF RANGE"} ({distance ? Math.round(distance) : 0}m)
            </Text>
          </View>
        </View>

        <TextInput 
          style={styles.input} 
          placeholder="Enter Registration Number" 
          value={regNumber} 
          onChangeText={setRegNumber} 
        />

        <TouchableOpacity 
          style={[styles.btn, (!inRange || !isSessionLive || loading) && styles.disabled]} 
          onPress={handleMarkAttendance} 
          disabled={!inRange || !isSessionLive || loading}
        >
          <Text style={styles.btnText}>
            {!isSessionLive ? "WAITING FOR LECTURER" : "SIGN ATTENDANCE"}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Your Attendance History</Text>
        {history.map(item => (
          <View key={item.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{new Date(item.marked_at).toLocaleDateString()}</Text>
            <Text style={styles.historyStatus}>{item.status}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 25, color: '#1A1A1A' },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statusBox: { padding: 15, borderRadius: 12, width: '48%', alignItems: 'center', elevation: 1 },
  input: { backgroundColor: '#F8F9FA', padding: 18, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 16 },
  btn: { backgroundColor: '#185FA5', padding: 20, borderRadius: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  disabled: { backgroundColor: '#BDBDBD' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 35 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FDFDFD', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  historyDate: { color: '#666' },
  historyStatus: { fontWeight: 'bold', color: '#2E7D32' }
});
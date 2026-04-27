import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { checkLocationStatus } from '@/src/useGeofence';

export default function AttendanceScreen() {
  const [session, setSession] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState({ isInside: false, distance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Fetch Active Session
      const { data } = await supabase.from('sessions').select('*').eq('is_active', true).single();
      if (data) {
        setSession(data);
        // 2. Initial Location Check
        const status = await checkLocationStatus(data.lat, data.lon, data.radius_m);
        setLocationStatus({ isInside: status.isInside, distance: status.currentDistance });
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleMarkPresent = async () => {
    // Biometric Check [cite: 7, 15]
    const auth = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verify identity' });
    if (!auth.success) return Alert.alert("Auth Failed");

    const { data: { user } } = await supabase.auth.getUser();
    
    // Log Attendance [cite: 18]
    const { error } = await supabase.from('attendance').insert([
      { session_id: session.id, student_id: user?.id }
    ]);

    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Attendance marked successfully!");
  };

  if (loading) return <ActivityIndicator style={{flex:1}} />;

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>Mark attendance</Text>
      
      <View style={styles.classCard}>
        <Text style={styles.className}>{session?.course_code || 'No Active Class'}</Text>
        <Text style={styles.classDetails}>Room {session?.room_name || 'N/A'}</Text>
      </View>

      {/* Mockup Match: Badge */}
      <View style={[styles.badge, locationStatus.isInside ? styles.badgeGreen : styles.badgeRed]}>
        <Text style={locationStatus.isInside ? styles.textGreen : styles.textRed}>
          {locationStatus.isInside ? '● Inside classroom' : '○ Outside zone'}
        </Text>
      </View>

      {/* Mockup Match: GPS Ring */}
      <View style={[styles.gpsRingOuter, { borderColor: locationStatus.isInside ? '#1D9E75' : '#E24B4A' }]}>
        <View style={styles.gpsRingInner}>
          <Ionicons name="finger-print" size={40} color={locationStatus.isInside ? "#0F6E56" : "#A32D2D"} />
        </View>
      </View>

      <Text style={styles.distLabel}>Verified · {locationStatus.distance}m from centre</Text>

      <TouchableOpacity 
        style={[styles.btnPrimary, { opacity: locationStatus.isInside ? 1 : 0.5 }]} 
        onPress={handleMarkPresent}
        disabled={!locationStatus.isInside}
      >
        <Text style={styles.btnText}>Mark present</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 25, backgroundColor: '#fff', alignItems: 'center' },
  header: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 15 },
  classCard: { backgroundColor: '#F8F9FA', width: '100%', padding: 15, borderRadius: 12, marginBottom: 15 },
  className: { fontWeight: 'bold', fontSize: 16 },
  classDetails: { color: '#666', fontSize: 12 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 20 },
  badgeGreen: { backgroundColor: '#E1F5EE' },
  badgeRed: { backgroundColor: '#FCEBEB' },
  textGreen: { color: '#085041', fontWeight: 'bold' },
  textRed: { color: '#A32D2D', fontWeight: 'bold' },
  gpsRingOuter: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderStyle: 'solid', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  gpsRingInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  distLabel: { fontSize: 12, color: '#999', marginBottom: 30 },
  btnPrimary: { backgroundColor: '#185FA5', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabase';
import LecturerReport from './lecturerReport';

export default function LecturerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('lecturer_id', user?.id)
      .eq('is_active', true)
      .maybeSingle();

    if (data) setActiveSession(data);
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert("Denied", "Location needed.");

      const location = await Location.getCurrentPositionAsync({});
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from('sessions').insert([
        {
          lecturer_id: user?.id,
          course_code: 'CS301',
          room_name: 'LT-4',
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          radius_m: 150,
          is_active: true
        }
      ]).select().single();

      if (error) throw error;
      setActiveSession(data);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header aligned with Mockup Style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Ionicons name="log-out-outline" size={24} color="#185FA5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lecturer Portal</Text>
        <TouchableOpacity onPress={checkActiveSession}>
          <Ionicons name="refresh" size={24} color="#185FA5" />
        </TouchableOpacity>
      </View>

      {!activeSession ? (
        <View style={styles.content}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={60} color="#185FA5" />
          </View>
          <Text style={styles.welcomeText}>Class Readiness</Text>
          <Text style={styles.subText}>Stand in the center of the room and start the session to set the geofence.</Text>
          
          <TouchableOpacity style={styles.startBtn} onPress={startSession} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>START SESSION</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <LecturerReport sessionId={activeSession.id} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#185FA5' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E6F1FB', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subText: { textAlign: 'center', color: '#777', marginTop: 10, marginBottom: 40, lineHeight: 20 },
  startBtn: { backgroundColor: '#185FA5', width: '100%', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { supabase } from '../../supabase';
import { Ionicons } from '@expo/vector-icons';

// Interface to fix the 'never' type error for the attendance list
interface AttendanceRecord {
  id: string;
  marked_at: string;
  profiles: { 
    full_name: string; 
    reg_number: string; 
  } | { 
    full_name: string; 
    reg_number: string; 
  }[];
}

export default function LecturerPortal() {
  const [reports, setReports] = useState<any[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    fetchSessionStatus();
    fetchReports();
  }, []);

  const fetchSessionStatus = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('is_active')
      .eq('course_code', 'SCT211')
      .single();
    
    if (data) setIsSessionActive(data.is_active);
  };

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('id, marked_at, profiles(full_name, reg_number)')
      .order('marked_at', { ascending: false });

    if (!error && data) {
      const formatted = (data as unknown as AttendanceRecord[]).map(item => {
        const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        return { 
          id: item.id, 
          name: profile?.full_name || 'Unknown', 
          reg: profile?.reg_number || 'N/A', 
          time: new Date(item.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
      });
      setReports(formatted);
    }
    setLoading(false);
  };

  const toggleSession = async () => {
    const nextStatus = !isSessionActive;

    // --- THE FIX: STRICT DATA FILTERING ---
    // We explicitly define a new object with ONLY the two columns that 
    // actually exist in your clean database. This stops the "Null Value" errors.
    const cleanSessionData = {
      course_code: 'SCT211',
      is_active: nextStatus
    };

    const { error } = await supabase
      .from('sessions')
      .upsert(cleanSessionData, { onConflict: 'course_code' });

    if (!error) {
      setIsSessionActive(nextStatus);
      Alert.alert("Success", nextStatus ? "Class Session Started" : "Class Session Ended");
    } else {
      console.error("Supabase Error:", error);
      Alert.alert("Database Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Lecturer Portal</Text>
        <TouchableOpacity onPress={fetchReports} style={styles.refreshIcon}>
          <Ionicons name="refresh" size={24} color="#185FA5" />
        </TouchableOpacity>
      </View>

      {/* Control Card */}
      <View style={[styles.card, { backgroundColor: isSessionActive ? '#E8F5E9' : '#F0F7FF' }]}>
        <Text style={styles.cardLabel}>SESSION CONTROL (SCT211)</Text>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: isSessionActive ? '#D32F2F' : '#2E7D32' }]} 
          onPress={toggleSession}
        >
          <Text style={styles.btnText}>
            {isSessionActive ? "STOP SESSION" : "START SESSION"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {isSessionActive ? "Status: Receiving Attendance" : "Status: Gate Closed"}
        </Text>
      </View>

      {/* Attendance List */}
      <Text style={styles.listTitle}>Live Attendance Logs</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#185FA5" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.reg}>{item.reg}</Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 40, 
    marginBottom: 20 
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  refreshIcon: { padding: 5 },
  card: { 
    padding: 30, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  cardLabel: { fontSize: 11, fontWeight: 'bold', color: '#777', marginBottom: 15, letterSpacing: 1 },
  btn: { 
    paddingVertical: 14, 
    paddingHorizontal: 45, 
    borderRadius: 12, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 2 
  },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  hint: { marginTop: 12, fontSize: 13, color: '#555', fontStyle: 'italic' },
  listTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 18, 
    backgroundColor: '#F9FAFB', 
    borderRadius: 15, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F0F0F0' 
  },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  reg: { fontSize: 12, color: '#888', marginTop: 2 },
  time: { color: '#185FA5', fontWeight: 'bold', fontSize: 13 }
});
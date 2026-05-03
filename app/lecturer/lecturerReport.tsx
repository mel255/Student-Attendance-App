import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView
} from 'react-native';
import { supabase } from '../../supabase';
import { Ionicons } from '@expo/vector-icons';

interface AttendanceRecord {
  id: string;
  marked_at: string;
  profiles: { full_name: string; reg_number: string; } |
            { full_name: string; reg_number: string; }[];
}

interface Props {
  sessionId: number;
  courseCode: string;
  onSessionEnd: () => void;
}

export default function LecturerReport({ sessionId, courseCode, onSessionEnd }: Props) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    fetchReports();
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('id, marked_at, profiles(full_name, reg_number)')
      .eq('session_id', sessionId) // Only this session's attendance
      .order('marked_at', { ascending: false });

    if (!error && data) {
      const formatted = (data as unknown as AttendanceRecord[]).map(item => {
        const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        return {
          id: item.id,
          name: profile?.full_name || 'Unknown',
          reg: profile?.reg_number || 'N/A',
          time: new Date(item.marked_at).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit'
          }),
        };
      });
      setReports(formatted);
    }
    setLoading(false);
  };

  const endSession = async () => {
    Alert.alert(
      'End Session',
      `End session for ${courseCode}? Students will no longer be able to mark attendance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session', style: 'destructive',
          onPress: async () => {
            setEnding(true);
            const { error } = await supabase
              .from('sessions')
              .update({ is_active: false, ended_at: new Date().toISOString() })
              .eq('id', sessionId);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Session Ended', `${courseCode} session closed.`);
              onSessionEnd();
            }
            setEnding(false);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Attendance</Text>
          <Text style={styles.subtitle}>{courseCode}</Text>
        </View>
        <TouchableOpacity onPress={fetchReports} style={styles.refreshIcon}>
          <Ionicons name="refresh" size={24} color="#185FA5" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{reports.length}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>●</Text>
          <Text style={[styles.statLabel, { color: '#2E7D32' }]}>LIVE</Text>
        </View>
      </View>

      <Text style={styles.listTitle}>Attendance Logs</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#185FA5" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No students have marked attendance yet.</Text>
          }
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

      {/* End Session Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.endBtn}
          onPress={endSession}
          disabled={ending}
        >
          {ending
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.endBtnText}>END SESSION</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 20, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#185FA5', fontWeight: '600', marginTop: 2 },
  refreshIcon: { padding: 5 },
  statsBar: { flexDirection: 'row', backgroundColor: '#F0F7FF', borderRadius: 16, padding: 20, marginBottom: 25, alignItems: 'center', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#185FA5' },
  statLabel: { fontSize: 12, color: '#777', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: '#D0E4F7' },
  listTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#F9FAFB', borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  reg: { fontSize: 12, color: '#888', marginTop: 2 },
  time: { color: '#185FA5', fontWeight: 'bold', fontSize: 13 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  endBtn: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 4 },
  endBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
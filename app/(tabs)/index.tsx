import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setHistory(data);
    setLoading(false);
  };

  useFocusEffect(React.useCallback(() => { fetchAttendance(); }, []));

  return (
    <View style={styles.container}>
      {/* 1. Analytics Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.progressCircle}>
          <Text style={styles.percentage}>85%</Text>
          <Text style={styles.percentageLabel}>Attendance</Text>
        </View>
        <View style={styles.statsRight}>
          <Text style={styles.statTitle}>Semester Overview</Text>
          <Text style={styles.statSub}>Unit: BIT 2301</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '85%' }]} />
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Logs</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1A237E" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={styles.logInfo}>
                <Text style={styles.logDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.logTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: item.verified ? '#E8F5E9' : '#FFF3E0' }]}>
                  <Ionicons name={item.verified ? "checkmark-circle" : "alert-circle"} size={14} color={item.verified ? "#2E7D32" : "#EF6C00"} />
                  <Text style={[styles.badgeText, { color: item.verified ? "#2E7D32" : "#EF6C00" }]}>
                    {item.verified ? "VERIFIED" : "MANUAL"}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No records found yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 60 },
  summaryCard: { backgroundColor: '#1A237E', borderRadius: 20, padding: 25, flexDirection: 'row', alignItems: 'center', elevation: 4, marginBottom: 30 },
  progressCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 6, borderColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  percentage: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  percentageLabel: { color: '#A9B0FF', fontSize: 10 },
  statsRight: { marginLeft: 20, flex: 1 },
  statTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  statSub: { color: '#A9B0FF', fontSize: 14, marginVertical: 5 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 10 },
  progressBarFill: { height: 6, backgroundColor: '#4CAF50', borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  logCard: { backgroundColor: '#fff', borderRadius: 15, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, elevation: 1 },
  logInfo: { flex: 1 }, // Added this to fix your error
  logDate: { fontSize: 16, fontWeight: '600', color: '#333' },
  logTime: { fontSize: 14, color: '#888', marginTop: 2 },
  badgeContainer: { alignItems: 'flex-end' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
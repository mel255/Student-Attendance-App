import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '../../supabase'; 


export default function AnalyticsReportScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Simple Analytics Calculation
  const totalPresent = history.length;
  const attendanceRate = totalPresent > 0 ? (totalPresent / 10) * 100 : 0; // Assuming 10 classes total

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance Analytics</Text>
      
      {/* 1. Analytics Summary Cards (Requirement: Analytics View) */}
      <View style={styles.row}>
        <View style={styles.cardSmall}>
          <Text style={styles.cardLabel}>Total Classes</Text>
          <Text style={styles.cardValue}>{totalPresent}</Text>
        </View>
        <View style={styles.cardSmall}>
          <Text style={styles.cardLabel}>Attendance Rate</Text>
          <Text style={styles.cardValue}>{attendanceRate}%</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>Recent Logs</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString()}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>PRESENT</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa', paddingTop: 60 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 20 },
  subHeader: { fontSize: 18, fontWeight: '600', color: '#444', marginBottom: 15, marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardSmall: { backgroundColor: '#fff', padding: 15, borderRadius: 12, width: '47%', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  cardLabel: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#007AFF', marginTop: 5 },
  logCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#28a745' },
  date: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  time: { fontSize: 13, color: '#888' },
  statusBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  statusText: { color: '#28a745', fontWeight: 'bold', fontSize: 12 }
});
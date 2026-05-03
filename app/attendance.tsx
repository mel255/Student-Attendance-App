import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, SafeAreaView
} from 'react-native';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../supabase';
import { checkLocationStatus } from '../src/useGeofence';

interface UnitStat {
  unit_code: string;
  unit_name: string;
  attended: number;
  total: number;
  pct: number;
}

export default function StudentPortal() {
  const [regNumber, setRegNumber] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [inRange, setInRange] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [unitStats, setUnitStats] = useState<UnitStat[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null); // null = show all
  const [locationSubscription, setLocationSubscription] = useState<any>(null);

  useEffect(() => {
    checkSessionAndHistory();
    const interval = setInterval(checkSessionAndHistory, 5000);
    return () => {
      clearInterval(interval);
      locationSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (activeSession?.lat && activeSession?.lon) {
      startLocationTracking(activeSession.lat, activeSession.lon, activeSession.radius_m ?? 150);
    }
  }, [activeSession?.id]);

  const checkSessionAndHistory = async () => {
    // Get active session
    const { data: session } = await supabase
      .from('sessions')
      .select('id, is_active, lat, lon, radius_m, course_code, units(unit_name)')
      .eq('is_active', true)
      .maybeSingle();

    setActiveSession(session ?? null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Full attendance history with unit info
    const { data: logs } = await supabase
      .from('attendance')
      .select('id, marked_at, status, sessions(course_code, unit_id, units(unit_name))')
      .eq('student_id', user.id)
      .order('marked_at', { ascending: false });

    if (logs) {
      setHistory(logs);
      buildUnitStats(logs, user.id);
    }
  };

  const buildUnitStats = async (logs: any[], userId: string) => {
    // Get all units the student is enrolled in
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('units(id, unit_code, unit_name)')
      .eq('student_id', userId);

    if (!enrollments) return;

    const enrolledUnits = enrollments
      .map((e: any) => e.units)
      .filter(Boolean)
      .flat();

    // For each enrolled unit, count total completed sessions and attended ones
    const stats: UnitStat[] = await Promise.all(
      enrolledUnits.map(async (unit: any) => {
        // Total completed sessions for this unit
        const { count: total } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('unit_id', unit.id)
          .eq('is_active', false);

        // Sessions this student attended for this unit
        const attended = logs.filter(
          (log) => log.sessions?.units?.unit_name === unit.unit_name
        ).length;

        const totalCount = total ?? 0;
        const pct = totalCount > 0 ? Math.round((attended / totalCount) * 100) : attended > 0 ? 100 : 0;

        return {
          unit_code: unit.unit_code,
          unit_name: unit.unit_name,
          attended,
          total: totalCount,
          pct,
        };
      })
    );

    setUnitStats(stats);
  };

  const startLocationTracking = async (targetLat: number, targetLon: number, radius: number) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required to mark attendance.');
      return;
    }

    locationSubscription?.remove();

    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (loc) => {
        const R = 6371e3;
        const dLat = (targetLat - loc.coords.latitude) * Math.PI / 180;
        const dLon = (targetLon - loc.coords.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(loc.coords.latitude * Math.PI / 180) *
          Math.cos(targetLat * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setDistance(Math.round(d));
        setInRange(d <= radius);
      }
    );
    setLocationSubscription(sub);
  };

  const handleMarkAttendance = async () => {
    if (!regNumber.trim()) return Alert.alert('Required', 'Enter Registration Number');
    if (!activeSession) return Alert.alert('No Session', 'No active session found.');
    setLoading(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const bio = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity',
          fallbackLabel: 'Use PIN',
          disableDeviceFallback: false,
        });
        if (!bio.success) {
          if (bio.error === 'user_cancel') throw new Error('Authentication cancelled.');
          throw new Error('Identity verification failed.');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expired. Please log in again.');

      if (activeSession.lat && activeSession.lon) {
        const { isInside } = await checkLocationStatus(
          activeSession.lat, activeSession.lon, activeSession.radius_m ?? 150
        );
        if (!isInside) throw new Error('You are outside the classroom geofence.');
      }

      await supabase.from('profiles').upsert({
        id: user.id,
        reg_number: regNumber.trim().toUpperCase(),
        updated_at: new Date().toISOString(),
      });

      const { error } = await supabase.from('attendance').insert([{
        student_id: user.id,
        session_id: activeSession.id,
        status: 'Present',
      }]);

      if (error) {
        if (error.code === '23505') throw new Error('Already marked for this session.');
        throw error;
      }

      Alert.alert('✅ Success', 'Attendance marked successfully!');
      checkSessionAndHistory();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter history by selected unit
  const filteredHistory = selectedUnit
    ? history.filter((item) => item.sessions?.course_code === selectedUnit)
    : history;

  const overallAttended = history.length;
  const overallTotal = unitStats.reduce((sum, u) => sum + u.total, 0);
  const overallPct = overallTotal > 0
    ? Math.round((overallAttended / overallTotal) * 100)
    : overallAttended > 0 ? 100 : 0;
  const pctColor = overallPct >= 75 ? '#2E7D32' : overallPct >= 50 ? '#EF6C00' : '#C62828';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <Text style={styles.header}>Student Portal</Text>

        {activeSession && (
          <Text style={styles.courseChip}>
            📚 {activeSession.course_code}
            {activeSession.units?.unit_name ? ` · ${activeSession.units.unit_name}` : ''}
          </Text>
        )}

        {/* ── OVERALL STATS ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{overallAttended}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Attended</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: pctColor }]}>{overallPct}%</Text>
            <Text style={styles.statLabel}>Overall{'\n'}Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{unitStats.length}</Text>
            <Text style={styles.statLabel}>Units{'\n'}Enrolled</Text>
          </View>
        </View>

        {overallTotal > 0 && overallPct < 75 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ Overall attendance below 75% threshold</Text>
          </View>
        )}

        {/* ── PER-UNIT BREAKDOWN ── */}
        {unitStats.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Attendance by Unit</Text>
            {unitStats.map((unit) => {
              const uColor = unit.pct >= 75 ? '#2E7D32' : unit.pct >= 50 ? '#EF6C00' : '#C62828';
              const barWidth = `${unit.pct}%`;
              return (
                <TouchableOpacity
                  key={unit.unit_code}
                  style={[
                    styles.unitCard,
                    selectedUnit === unit.unit_code && styles.unitCardSelected,
                  ]}
                  onPress={() =>
                    setSelectedUnit(selectedUnit === unit.unit_code ? null : unit.unit_code)
                  }
                >
                  <View style={styles.unitCardHeader}>
                    <View>
                      <Text style={styles.unitCode}>{unit.unit_code}</Text>
                      <Text style={styles.unitName}>{unit.unit_name}</Text>
                    </View>
                    <Text style={[styles.unitPct, { color: uColor }]}>{unit.pct}%</Text>
                  </View>
                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                   <View 
  style={[
    styles.progressFill, 
    { width: `${barWidth}%`, backgroundColor: uColor } as any
  ]} 
/>

                  </View>
                  <Text style={styles.unitMeta}>{unit.attended} of {unit.total} sessions</Text>
                </TouchableOpacity>
              );
            })}
            {selectedUnit && (
              <TouchableOpacity onPress={() => setSelectedUnit(null)} style={styles.clearFilter}>
                <Text style={styles.clearFilterText}>✕ Clear filter — show all units</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── SESSION STATUS ── */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBox, { backgroundColor: activeSession ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={{ color: activeSession ? '#2E7D32' : '#C62828', fontWeight: 'bold', fontSize: 12 }}>
              {activeSession ? '● SESSION LIVE' : '○ NO SESSION'}
            </Text>
          </View>
          <View style={[styles.statusBox, { backgroundColor: inRange ? '#E3F2FD' : '#FFF3E0' }]}>
            <Text style={{ color: inRange ? '#1565C0' : '#EF6C00', fontWeight: 'bold', fontSize: 12 }}>
              {inRange ? 'IN RANGE' : 'OUT OF RANGE'} ({distance ?? 0}m)
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Registration Number (e.g. SCT211-0001/2023)"
          value={regNumber}
          onChangeText={setRegNumber}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.btn, (!inRange || !activeSession || loading) && styles.disabled]}
          onPress={handleMarkAttendance}
          disabled={!inRange || !activeSession || loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.btnText}>
                {!activeSession ? 'WAITING FOR LECTURER' : 'SIGN ATTENDANCE'}
              </Text>
          }
        </TouchableOpacity>

        {/* ── HISTORY (filtered) ── */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>
          {selectedUnit ? `History — ${selectedUnit}` : 'All Attendance History'}
        </Text>

        {filteredHistory.length === 0 && (
          <Text style={styles.emptyText}>
            {selectedUnit ? `No attendance records for ${selectedUnit} yet.` : 'No attendance records yet.'}
          </Text>
        )}

        {filteredHistory.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <View>
              <Text style={styles.historyDate}>
                {new Date(item.marked_at).toLocaleDateString('en-KE', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })}
              </Text>
              <Text style={styles.historyUnit}>
                {item.sessions?.course_code ?? 'Unknown Unit'}
              </Text>
            </View>
            <View style={styles.presentBadge}>
              <Text style={styles.presentText}>{item.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, color: '#1A1A1A' },
  courseChip: { fontSize: 13, color: '#185FA5', fontWeight: '600', marginBottom: 16, backgroundColor: '#E6F1FB', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },

  // Overall stats
  statsRow: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#F0F0F0' },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#185FA5' },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 3, lineHeight: 15 },
  statDivider: { width: 1, height: 38, backgroundColor: '#E0E0E0' },
  warningBanner: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#EF6C00' },
  warningText: { color: '#E65100', fontSize: 13, fontWeight: '600' },

  // Per-unit cards
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 4, color: '#333' },
  unitCard: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  unitCardSelected: { borderColor: '#185FA5', backgroundColor: '#EBF3FC' },
  unitCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  unitCode: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  unitName: { fontSize: 12, color: '#888', marginTop: 2 },
  unitPct: { fontSize: 20, fontWeight: 'bold' },
  progressTrack: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  unitMeta: { fontSize: 11, color: '#999' },
  clearFilter: { alignSelf: 'center', marginBottom: 16, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F0F0F0', borderRadius: 20 },
  clearFilterText: { fontSize: 12, color: '#555', fontWeight: '600' },

  // Session status
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, marginTop: 8 },
  statusBox: { padding: 12, borderRadius: 12, width: '48%', alignItems: 'center' },
  input: { backgroundColor: '#F8F9FA', padding: 18, borderRadius: 15, marginBottom: 18, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 16 },
  btn: { backgroundColor: '#185FA5', padding: 20, borderRadius: 15, alignItems: 'center' },
  disabled: { backgroundColor: '#BDBDBD' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // History
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 28 },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 10, marginBottom: 10 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FDFDFD', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  historyDate: { color: '#444', fontWeight: '600', fontSize: 14 },
  historyUnit: { fontSize: 11, color: '#999', marginTop: 2 },
  presentBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  presentText: { fontWeight: 'bold', color: '#2E7D32', fontSize: 12 },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, SafeAreaView
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabase';
import LecturerReport from './lecturerReport';

interface Unit {
  id: number;
  unit_code: string;
  unit_name: string;
}

export default function LecturerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(true);

  useEffect(() => {
    checkActiveSession();
    fetchAssignedUnits();
  }, []);

  const checkActiveSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('sessions')
      .select('*, units(unit_code, unit_name)')
      .eq('lecturer_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    setActiveSession(data ?? null);
  };

  const fetchAssignedUnits = async () => {
    setLoadingUnits(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch units assigned to this lecturer via lecturer_units join table
    const { data, error } = await supabase
      .from('lecturer_units')
      .select('units(id, unit_code, unit_name)')
      .eq('lecturer_id', user.id);

    if (!error && data) {
      const parsed: Unit[] = data
        .map((row: any) => row.units)
        .filter(Boolean)
        .flat();
      setUnits(parsed);
      // Auto-select first unit if only one assigned
      if (parsed.length === 1) setSelectedUnit(parsed[0]);
    }
    setLoadingUnits(false);
  };

  const startSession = async () => {
    if (!selectedUnit) return Alert.alert('Select Unit', 'Please select a unit to start the session.');
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission Denied', 'Location is needed to set the geofence.');
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('sessions').insert([{
        lecturer_id: user.id,
        unit_id: selectedUnit.id,
        course_code: selectedUnit.unit_code,
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        radius_m: 150,
        is_active: true,
      }]).select('*, units(unit_code, unit_name)').single();

      if (error) throw error;
      setActiveSession(data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  // ── Active session view ──
  if (activeSession) {
    return (
      <LecturerReport
        sessionId={activeSession.id}
        courseCode={activeSession.course_code ?? activeSession.units?.unit_code}
        onSessionEnd={() => {
          setActiveSession(null);
          setSelectedUnit(null);
        }}
      />
    );
  }

  // ── Start session view ──
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#185FA5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lecturer Portal</Text>
        <TouchableOpacity onPress={checkActiveSession}>
          <Ionicons name="refresh" size={24} color="#185FA5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={50} color="#185FA5" />
        </View>
        <Text style={styles.welcomeText}>Start a Class Session</Text>
        <Text style={styles.subText}>
          Stand in the classroom centre, select your unit, then start the session to set the geofence.
        </Text>

        {/* Unit Selector */}
        <Text style={styles.sectionLabel}>SELECT UNIT</Text>
        {loadingUnits ? (
          <ActivityIndicator color="#185FA5" style={{ marginVertical: 20 }} />
        ) : units.length === 0 ? (
          <View style={styles.emptyUnits}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF6C00" />
            <Text style={styles.emptyUnitsText}>
              No units assigned. Contact admin to be assigned units.
            </Text>
          </View>
        ) : (
          <View style={styles.unitList}>
            {units.map((unit) => {
              const isSelected = selectedUnit?.id === unit.id;
              return (
                <TouchableOpacity
                  key={unit.id}
                  style={[styles.unitCard, isSelected && styles.unitCardSelected]}
                  onPress={() => setSelectedUnit(unit)}
                >
                  <View style={styles.unitCardLeft}>
                    <Text style={[styles.unitCode, isSelected && styles.unitCodeSelected]}>
                      {unit.unit_code}
                    </Text>
                    <Text style={[styles.unitName, isSelected && styles.unitNameSelected]}>
                      {unit.unit_name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#185FA5" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected unit confirmation */}
        {selectedUnit && (
          <View style={styles.selectedBanner}>
            <Ionicons name="location" size={16} color="#185FA5" />
            <Text style={styles.selectedBannerText}>
              Geofence will be set for <Text style={{ fontWeight: 'bold' }}>{selectedUnit.unit_code}</Text> at your current location
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.startBtn, (!selectedUnit || loading) && styles.disabled]}
          onPress={startSession}
          disabled={!selectedUnit || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>START SESSION</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 15,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#185FA5' },
  content: { padding: 25, alignItems: 'center' },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E6F1FB', justifyContent: 'center',
    alignItems: 'center', marginBottom: 20, marginTop: 10,
  },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subText: { textAlign: 'center', color: '#777', lineHeight: 20, marginBottom: 30 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#999',
    letterSpacing: 1.2, alignSelf: 'flex-start', marginBottom: 12,
  },
  unitList: { width: '100%', marginBottom: 20 },
  unitCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12,
    marginBottom: 10, borderWidth: 2, borderColor: 'transparent',
  },
  unitCardSelected: {
    borderColor: '#185FA5', backgroundColor: '#EBF3FC',
  },
  unitCardLeft: { flex: 1 },
  unitCode: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  unitCodeSelected: { color: '#185FA5' },
  unitName: { fontSize: 12, color: '#888', marginTop: 2 },
  unitNameSelected: { color: '#4A90C4' },

  emptyUnits: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF3E0', padding: 16, borderRadius: 12,
    marginBottom: 20, width: '100%',
  },
  emptyUnitsText: { flex: 1, color: '#E65100', fontSize: 13 },

  selectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E6F1FB', padding: 12, borderRadius: 10,
    marginBottom: 20, width: '100%',
  },
  selectedBannerText: { flex: 1, fontSize: 13, color: '#185FA5' },

  startBtn: {
    backgroundColor: '#185FA5', width: '100%',
    padding: 18, borderRadius: 12, alignItems: 'center',
  },
  disabled: { backgroundColor: '#BDBDBD' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

export default function LecturerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLecturerLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Fill all fields");
    
    setLoading(true);
    try {
      // 1. Sign In
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      // 2. The "Guard" - Check database role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user?.id)
        .single();

      if (profile?.role !== 'lecturer') {
        await supabase.auth.signOut(); // Kick them out of the session
        throw new Error("Unauthorized: This email is not registered as Staff.");
      }

      // 3. Success - Go to Lecturer Dashboard
      router.replace('/lecturer'); 
      
    } catch (err: any) {
      Alert.alert("Staff Access Denied", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#185FA5" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="briefcase" size={40} color="#185FA5" />
        </View>
        <Text style={styles.title}>Staff Portal</Text>
        <Text style={styles.subtitle}>Lecturer Authentication</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Staff Email</Text>
        <TextInput 
          style={styles.input} 
          placeholder="staff@jkuat.ac.ke" 
          value={email} 
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input} 
          placeholder="••••••••" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />
        <TouchableOpacity style={styles.loginBtn} onPress={handleLecturerLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>LOGIN TO DASHBOARD</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#E6F1FB', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { color: '#999', fontSize: 13 },
  form: { width: '100%' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, color: '#444' },
  input: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  loginBtn: { backgroundColor: '#185FA5', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 }
});
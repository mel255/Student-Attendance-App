import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: 'lecturer' | 'student' }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isLecturer = role === 'lecturer';

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Required', 'Please fill in all fields.');
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user?.id)
        .single();

      if (profileError) throw new Error('Profile not found. Contact admin.');

      const actualRole = profile.role.toLowerCase();

      // Guard: lecturer button should not let students through, and vice versa
      if (role && actualRole !== role) {
        await supabase.auth.signOut();
        throw new Error(
          role === 'lecturer'
            ? 'This account is not registered as staff.'
            : 'This account is not registered as a student.'
        );
      }

      if (actualRole === 'lecturer') {
        router.replace('/lecturer');
      } else {
        router.replace('/attendance');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) return Alert.alert('Email Needed', 'Enter your email to receive a reset link.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Success', 'Reset link sent to your email!');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#185FA5" />
        </TouchableOpacity>

        {/* Branding — changes based on role param */}
        <View style={styles.header}>
          <View style={[styles.logoBox, { backgroundColor: isLecturer ? '#E6F1FB' : '#E1F5EE' }]}>
            <Ionicons
              name={isLecturer ? 'briefcase' : 'person'}
              size={45}
              color={isLecturer ? '#185FA5' : '#0F6E56'}
            />
          </View>
          <Text style={styles.title}>GPS Attendance</Text>
          <Text style={styles.subtitle}>
            {isLecturer ? 'Staff / Lecturer Login' : 'Student Login'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>University Email</Text>
          <View style={styles.inputField}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder={isLecturer ? 'staff@jkuat.ac.ke' : 'name@students.jkuat.ac.ke'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputField}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: isLecturer ? '#185FA5' : '#0F6E56' }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginText}>SIGN IN</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotContainer} onPress={handleReset}>
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Jomo Kenyatta University of Agriculture and Technology</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { flexGrow: 1, padding: 30, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 60 },
  logoBox: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 4 },
  form: { width: '100%' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 15 },
  inputField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, borderWidth: 1, borderColor: '#EEE', paddingHorizontal: 15 },
  icon: { marginRight: 10 },
  textInput: { flex: 1, paddingVertical: 15, fontSize: 14, color: '#333' },
  loginBtn: { borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 30 },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  forgotContainer: { marginTop: 20, alignItems: 'center' },
  forgotText: { color: '#185FA5', fontSize: 14, fontWeight: '600' },
  footer: { marginTop: 50, alignItems: 'center' },
  footerText: { fontSize: 9, color: '#CCC', textAlign: 'center', letterSpacing: 0.5 },
});

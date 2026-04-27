import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Required", "Please fill in all fields.");
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

      if (profileError) throw new Error("Profile not found.");

      if (profile.role.toLowerCase() === 'lecturer') {
        router.replace('/lecturer');
      } else {
        router.replace('/attendance');
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) return Alert.alert("Email Needed", "Enter your email to receive a reset link.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Reset link sent to your email!");
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Branding Area */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="location" size={45} color="#185FA5" />
          </View>
          <Text style={styles.title}>GPS Attendance</Text>
          <Text style={styles.subtitle}>University Management System</Text>
        </View>

        {/* Input Area */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>University Email</Text>
          <View style={styles.inputField}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="name@jkuat.ac.ke"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
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
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>SIGN IN</Text>}
          </TouchableOpacity>

          {/* RESTORED: Forgot Password Option */}
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
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#E6F1FB', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 4 },
  form: { width: '100%' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 15 },
  inputField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, borderWidth: 1, borderColor: '#EEE', paddingHorizontal: 15 },
  icon: { marginRight: 10 },
  textInput: { flex: 1, paddingVertical: 15, fontSize: 14, color: '#333' },
  loginBtn: { backgroundColor: '#185FA5', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 30 },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  // Forgot Password Styling
  forgotContainer: { marginTop: 20, alignItems: 'center' },
  forgotText: { color: '#185FA5', fontSize: 14, fontWeight: '600' },
  
  footer: { marginTop: 50, alignItems: 'center' },
  footerText: { fontSize: 9, color: '#CCC', textAlign: 'center', letterSpacing: 0.5 }
});
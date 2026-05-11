import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, Radius, Fonts, Shadow, Gradients } from '../theme';
import InputBox from '../components/InputBox';
import AppButton from '../components/AppButton';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signIn } = useAuth();

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address.';
        return null;
      case 'password':
        if (!value) return 'Password is required.';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    if (errors[field]) {
      const err = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleLogin = async () => {
    const newErrors = {
      email: validateField('email', email),
      password: validateField('password', password),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      showAlert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient colors={Gradients.primary} style={styles.logoCircle}>
              <Text style={styles.logoIcon}>📝</Text>
            </LinearGradient>
            <Text style={styles.appName}>Noted</Text>
            <Text style={styles.appTagline}>Your smart notebook</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <InputBox
              label="Email"
              icon="✉️"
              placeholder="you@example.com"
              value={email}
              onChangeText={v => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <InputBox
              label="Password"
              icon="🔒"
              placeholder="Your password"
              value={password}
              onChangeText={v => handleChange('password', v)}
              secureTextEntry
              error={errors.password}
            />

            <AppButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.linkText}>
                Don't have an account?{' '}
                <Text style={styles.linkHighlight}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.md },

  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: {
    width: 80, height: 80, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    ...Shadow.button,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 30, color: Colors.text, ...Fonts.bold, letterSpacing: 0.5 },
  appTagline: { fontSize: 14, color: Colors.subtext, marginTop: 4, ...Fonts.regular },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.card,
  },
  title: { fontSize: 24, color: Colors.text, ...Fonts.bold, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.subtext, marginBottom: Spacing.lg },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.sm, color: Colors.subtext, fontSize: 13 },

  linkButton: { alignItems: 'center', paddingVertical: Spacing.sm },
  linkText: { fontSize: 14, color: Colors.subtext },
  linkHighlight: { color: Colors.primary, ...Fonts.semiBold },
});

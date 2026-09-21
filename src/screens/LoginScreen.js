import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API from '../services/api';

const { width, height } = Dimensions.get('window');

/* Data partikel latar belakang */
const PARTICLES = [
  { id: 1, text: '🕒', size: 26, startX: width * 0.1, duration: 22000, delay: 0 },
  { id: 2, text: '📅', size: 22, startX: width * 0.8, duration: 26000, delay: 1000 },
  { id: 3, text: '✔️', size: 20, startX: width * 0.45, duration: 20000, delay: 2000 },
  { id: 4, text: '👆', size: 22, startX: width * 0.65, duration: 28000, delay: 3000 },
  { id: 5, text: '🏢', size: 20, startX: width * 0.25, duration: 24000, delay: 5000 },
  { id: 6, text: '✔️', size: 18, startX: width * 0.85, duration: 21000, delay: 4000 },
];

/* Akun demo — tap untuk auto-fill */
const DEMO_ACCOUNTS = [
  {
    email: 'admin@absensi.test',
    password: '123456',
    name: 'Administrator',
    role: 'Admin',
    icon: 'shield-account',
  },
  {
    email: 'pegawai@absensi.test',
    password: '123456',
    name: 'Pegawai Demo',
    role: 'Pegawai',
    icon: 'account-tie',
  },
  {
    email: 'budi@absensi.test',
    password: '123456',
    name: 'Budi Santoso',
    role: 'Staff Marketing',
    icon: 'account',
  },
];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const animatedValues = useRef(
    PARTICLES.map(() => new Animated.Value(0))
  ).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  /* Partikel animasi */
  useEffect(() => {
    PARTICLES.forEach((particle, index) => {
      const anim = animatedValues[index];
      const loop = () => {
        anim.setValue(0);
        Animated.sequence([
          Animated.delay(particle.delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: particle.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start(() => loop());
      };
      loop();
    });
  }, []);

  /* Fade-in form */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ===== Handle Login (semua error dari API) ===== */
  const handleLogin = async () => {
    // ✅ Reset semua error dulu
    setErrors({});
    setGeneralError('');
    setLoading(true);

    try {
      const response = await API.post('/login', {
        email: email.trim(),
        password,
      });

      const token = response.data?.token || response.data?.data?.token;
      const user = response.data?.user || response.data?.data?.user;

      if (!token) {
        throw new Error('Token tidak diterima dari server.');
      }

      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user || {}));

      /* Redirect */
      if (!user?.photo) {
        navigation.replace('SetupPhoto');
      } else {
        navigation.replace('Main');
      }
    } catch (error) {
      console.log('❌ Login error:', error.response?.data || error.message);

      const status = error.response?.status;
      const data = error.response?.data;

      // 422 = validasi gagal (email/password salah)
      if (status === 422 && data?.errors) {
        setErrors(data.errors);
        // Kalau ada pesan umum di response, tampilkan juga
        if (data?.message && !data.errors.email && !data.errors.password) {
          setGeneralError(data.message);
        }
      }
      // 401 = unauthorized (email/password salah)
      else if (status === 401) {
        setGeneralError(
          data?.message || 'Email atau password salah.'
        );
      }
      // 429 = terlalu banyak percobaan
      else if (status === 429) {
        setGeneralError(
          data?.message || 'Terlalu banyak percobaan login. Coba lagi nanti.'
        );
      }
      // Error lain
      else {
        setGeneralError(
          data?.message ||
            error.message ||
            'Terjadi kesalahan. Silakan coba lagi.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* Quick login dari akun demo */
  const handleQuickLogin = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrors({});
    setGeneralError('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ===== BACKGROUND BIRU GRADIENT + PARTICLES ===== */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.bubbleTopRight} />
        <View style={styles.bubbleBottomLeft} />
        <View style={styles.bubbleCenter} />

        {PARTICLES.map((particle, index) => {
          const translateY = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [height + 50, -50],
          });
          const rotate = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });
          const opacity = animatedValues[index].interpolate({
            inputRange: [0, 0.15, 0.85, 1],
            outputRange: [0, 0.25, 0.25, 0],
          });

          return (
            <Animated.Text
              key={particle.id}
              style={[
                styles.particle,
                {
                  fontSize: particle.size,
                  left: particle.startX,
                  transform: [{ translateY }, { rotate }],
                  opacity,
                },
              ]}
            >
              {particle.text}
            </Animated.Text>
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* ===== HEADER BIRU ===== */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={48}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.title}>AbsensiOne</Text>
              <Text style={styles.subtitle}>
                Sistem Presensi Digital Pegawai
              </Text>

              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={12}
                    color="#93c5fd"
                  />
                  <Text style={styles.badgeText}>Aman</Text>
                </View>
                <View style={styles.badge}>
                  <MaterialCommunityIcons
                    name="face-recognition"
                    size={12}
                    color="#93c5fd"
                  />
                  <Text style={styles.badgeText}>Face ID</Text>
                </View>
                <View style={styles.badge}>
                  <MaterialCommunityIcons
                    name="map-marker-radius"
                    size={12}
                    color="#93c5fd"
                  />
                  <Text style={styles.badgeText}>Radius</Text>
                </View>
              </View>
            </View>

            {/* ===== CARD LOGIN ===== */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Masuk ke Akun</Text>

              {/* ✅ Alert umum dari API (kalau ada) */}
              {generalError ? (
                <View style={styles.errorBox}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={16}
                    color="#dc2626"
                  />
                  <Text style={styles.errorBoxText}>{generalError}</Text>
                </View>
              ) : null}

              {/* Email */}
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrap,
                  errors.email && styles.inputError,
                ]}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color="#94a3b8"
                />
                <TextInput
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email) {
                      setErrors((p) => ({ ...p, email: null }));
                    }
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email[0]}</Text>
              ) : null}

              {/* Password */}
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  errors.password && styles.inputError,
                ]}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={18}
                  color="#94a3b8"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (errors.password) {
                      setErrors((p) => ({ ...p, password: null }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password[0]}</Text>
              ) : null}

              {/* Tombol Login */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="login"
                      size={20}
                      color="#ffffff"
                    />
                    <Text style={styles.loginBtnText}>Masuk</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ===== DAFTAR AKUN DEMO ===== */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeader}>
                <View style={styles.demoLine} />
                <Text style={styles.demoTitle}>Akun Demo (Tap untuk isi)</Text>
                <View style={styles.demoLine} />
              </View>

              <View style={styles.demoList}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <TouchableOpacity
                    key={acc.email}
                    style={styles.demoItem}
                    onPress={() => handleQuickLogin(acc)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.demoIconWrap}>
                      <MaterialCommunityIcons
                        name={acc.icon}
                        size={20}
                        color="#2563eb"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.demoName}>{acc.name}</Text>
                      <Text style={styles.demoEmail}>{acc.email}</Text>
                    </View>
                    <View style={styles.demoRoleBadge}>
                      <Text style={styles.demoRoleText}>{acc.role}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ===== FOOTER ===== */}
            <Text style={styles.footerText}>
              © 2026 AbsensiOne · One Sarumaha · v1.0
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e40af',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  /* Bubble blur */
  bubbleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(96, 165, 250, 0.35)',
  },
  bubbleBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
  },
  bubbleCenter: {
    position: 'absolute',
    top: height * 0.35,
    left: width * 0.4,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
  },
  particle: {
    position: 'absolute',
    fontWeight: 'normal',
  },

  /* Header */
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    color: '#dbeafe',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Card */
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },

  /* Error box (general) */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorBoxText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },

  /* Input */
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    paddingVertical: 0,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  /* Login Button */
  loginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Demo Accounts */
  demoSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  demoLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  demoList: {
    gap: 8,
  },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  demoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  demoEmail: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    marginTop: 2,
  },
  demoRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(147, 197, 253, 0.25)',
  },
  demoRoleText: {
    color: '#dbeafe',
    fontSize: 9,
    fontWeight: '800',
  },

  /* Footer */
  footerText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 8,
    marginBottom: 20,
  },
});
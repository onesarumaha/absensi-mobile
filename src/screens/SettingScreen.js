import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../components/CustomAlert';
import { authApi } from '../services/api';

export default function SettingScreen({ navigation }) {
  // State untuk kontrol modal CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);

  /* ===== LOGOUT HANDLER ===== */
  const handleLogout = () => {
    setAlertVisible(true);
  };

  const onConfirmLogout = async () => {
    console.log('🚪 Logging out...');

    // 1. Panggil API logout (opsional)
    try {
      await authApi.logout();
      console.log('✅ API logout OK');
    } catch (e) {
      console.log('⚠️ API logout error (diabaikan):', e?.message);
    }

    // 2. Bersihkan storage lokal
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      console.log('✅ Storage cleared');
    } catch (e) {
      console.log('⚠️ Storage error:', e.message);
    }

    // 3. Reset navigasi ke Login
    try {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
      console.log('✅ Navigated to Login');
    } catch (e) {
      console.log('❌ Navigation error:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* ==== HEADER BIRU ==== */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Pengaturan</Text>
              <Text style={styles.headerSubtitle}>
                Kelola aplikasi & preferensi
              </Text>
            </View>

            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </View>

      {/* ==== KONTEN SCROLL ==== */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Group: ABSENSI */}
        <Group title="ABSENSI">
          <MenuItem
            icon="map-marker-radius-outline"
            label="Radius Absensi"
            desc="Atur jarak & lokasi kantor"
            onPress={() => navigation.navigate('RadiusSetting')}
          />
          <MenuItem
            icon="chart-timeline-variant"
            label="Riwayat Absensi"
            desc="Lihat data kehadiran"
            onPress={() => navigation.navigate('Attendance')}
          />
          <MenuItem
            icon="clock-outline"
            label="Jam Kerja"
            desc="Shift & toleransi keterlambatan"
            onPress={() => {}}
          />
        </Group>

        {/* Group: MANAJEMEN */}
        <Group title="MANAJEMEN">
          <MenuItem
            icon="account-group-outline"
            label="Data Pegawai"
            desc="Daftar & data karyawan"
            onPress={() => navigation.navigate('EmployeeList')}
          />
          <MenuItem
            icon="calendar-remove-outline"
            label="Pengajuan Izin"
            desc="Kelola izin & cuti"
            onPress={() => navigation.navigate('LeaveRequest')}
          />
          <MenuItem
            icon="file-chart-outline"
            label="Laporan"
            desc="Export laporan absensi"
            onPress={() => {}}
          />
        </Group>

        {/* Group: PREFERENSI */}
        <Group title="PREFERENSI">
          <SwitchItem
            icon="bell-outline"
            label="Notifikasi"
            desc="Pengingat absen masuk & pulang"
            initial={true}
          />
          <SwitchItem
            icon="vibrate"
            label="Getar"
            desc="Umpan balik saat tombol ditekan"
            initial={false}
          />
          <SwitchItem
            icon="theme-light-dark"
            label="Mode Gelap"
            desc="Ikuti pengaturan sistem"
            initial={false}
          />
          <SwitchItem
            icon="map-marker-check-outline"
            label="Lokasi Otomatis"
            desc="Deteksi lokasi saat absen"
            initial={true}
          />
        </Group>

        {/* Group: KEAMANAN */}
        <Group title="KEAMANAN">
          <MenuItem
            icon="lock-outline"
            label="Ubah PIN"
            desc="Ganti PIN aplikasi"
            onPress={() => {}}
          />
          <MenuItem
            icon="fingerprint"
            label="Login Biometrik"
            desc="Gunakan sidik jari / wajah"
            onPress={() => {}}
          />
        </Group>

        {/* Group: LAINNYA */}
        <Group title="LAINNYA">
          <MenuItem
            icon="help-circle-outline"
            label="Bantuan"
            desc="Panduan & FAQ"
            onPress={() => {}}
          />
          <MenuItem
            icon="information-outline"
            label="Tentang Aplikasi"
            desc="Versi 1.0.0"
            onPress={() => {}}
          />
        </Group>

        {/* ===== LOGOUT ===== */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          © 2026 AbsensiOne · One Sarumaha · v1.0
        </Text>
      </ScrollView>

      {/* ==== CUSTOM ALERT (MODAL) ==== */}
      <CustomAlert
        visible={alertVisible}
        type="confirm"
        title="Keluar Akun?"
        message="Apakah Anda yakin ingin keluar dari aplikasi ini?"
        confirmText="Keluar"
        cancelText="Batal"
        showCancel={true}
        onClose={() => setAlertVisible(false)}
        onConfirm={onConfirmLogout}
      />
    </View>
  );
}

/* ==== Group ==== */
function Group({ title, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/* ==== MenuItem ==== */
function MenuItem({ icon, label, desc, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color="#2563eb" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {desc ? <Text style={styles.itemDesc}>{desc}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />
    </TouchableOpacity>
  );
}

/* ==== SwitchItem ==== */
function SwitchItem({ icon, label, desc, initial = false }) {
  const [value, setValue] = useState(initial);

  return (
    <View style={styles.item}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color="#2563eb" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {desc ? <Text style={styles.itemDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={setValue}
        trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
        thumbColor={value ? '#2563eb' : '#f1f5f9'}
        ios_backgroundColor="#cbd5e1"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  /* HEADER BIRU */
  header: {
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    textAlign: 'center',
  },

  /* KONTEN */
  content: { padding: 16, paddingBottom: 40 },

  /* Group */
  group: { marginTop: 16 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 1.2,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  /* Item */
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  itemDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },

  /* LOGOUT */
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: 14,
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 20,
  },
});
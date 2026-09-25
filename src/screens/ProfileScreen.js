import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../components/AnimatedBackground';
import { authApi } from '../services/api'; // ← sesuaikan path

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const tabBarHeight = useBottomTabBarHeight();

  const fetchMe = useCallback(async () => {
    try {
      setError(null);
      const res = await authApi.me();
      setUser(res.data.user);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || 'Gagal memuat profil';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMe();
    }, [fetchMe])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMe();
  };

  /* ===== LOADING ===== */
  if (loading && !user) {
    return (
      <View style={styles.root}>
        <AnimatedBackground />
        <SafeAreaView style={styles.safe} edges={['top']}>
          <Header />
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Memuat profil…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  /* ===== ERROR ===== */
  if (error && !user) {
    return (
      <View style={styles.root}>
        <AnimatedBackground />
        <SafeAreaView style={styles.safe} edges={['top']}>
          <Header />
          <View style={styles.centerWrap}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={56}
              color="#dc2626"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchMe}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  /* ===== DATA ===== */
  const emp = user?.employee || {};
  const initial = (user?.name || 'U').charAt(0).toUpperCase();
  const status = (emp.status || '').toLowerCase();
  const isAktif = status === 'active' || status === 'aktif';

  return (
    <View style={styles.root}>
      <AnimatedBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ==== HEADER BIRU (bagian dari scroll) ==== */}
        <View style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View style={styles.backBtn} />
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle}>Profil Saya</Text>
                <Text style={styles.headerSubtitle}>
                  Data pribadi pegawai
                </Text>
              </View>
              <View style={styles.backBtn} />
            </View>
          </SafeAreaView>
        </View>

        {/* ==== KARTU PROFIL (overlap dari header) ==== */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {user?.photo_url ? (
              <Image
                source={{ uri: user.photo_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: isAktif ? '#22c55e' : '#94a3b8' },
              ]}
            />
          </View>

          <Text style={styles.name}>{user?.name || '-'}</Text>
          <Text style={styles.position}>
            {emp.position || '-'} • {emp.department || '-'}
          </Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: isAktif ? '#dcfce7' : '#fee2e2' },
              ]}
            >
              <MaterialCommunityIcons
                name={isAktif ? 'check-decagram' : 'close-circle'}
                size={14}
                color={isAktif ? '#16a34a' : '#dc2626'}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: isAktif ? '#16a34a' : '#dc2626' },
                ]}
              >
                {isAktif ? 'Aktif' : emp.status || 'Tidak Aktif'}
              </Text>
            </View>

            {emp.employee_number ? (
              <View style={[styles.badge, { backgroundColor: '#eff6ff' }]}>
                <MaterialCommunityIcons
                  name="badge-account-outline"
                  size={14}
                  color="#2563eb"
                />
                <Text style={[styles.badgeText, { color: '#2563eb' }]}>
                  {emp.employee_number}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ==== KONTEN BAWAH ==== */}
        <View style={styles.body}>
          {/* DATA PRIBADI */}
          <Group title="DATA PRIBADI">
            <InfoRow
              icon="account-outline"
              label="Nama Lengkap"
              value={emp.full_name || user?.name || '-'}
            />
            <InfoRow
              icon="card-account-details-outline"
              label="NIK"
              value={emp.employee_number || '-'}
            />
            <InfoRow
              icon="email-outline"
              label="Email"
              value={user?.email || '-'}
            />
            <InfoRow
              icon="phone-outline"
              label="No. HP"
              value={emp.phone || '-'}
            />
            <InfoRow
              icon="map-marker-outline"
              label="Alamat"
              value={emp.address || '-'}
            />
          </Group>

          {/* PEKERJAAN */}
          <Group title="PEKERJAAN">
            <InfoRow
              icon="briefcase-outline"
              label="Jabatan"
              value={emp.position || '-'}
            />
            <InfoRow
              icon="domain"
              label="Departemen"
              value={emp.department || '-'}
            />
            <InfoRow
              icon="calendar-account-outline"
              label="Bergabung"
              value={formatDate(emp.join_date)}
            />
            <InfoRow
              icon="shield-account-outline"
              label="Role"
              value={user?.role || '-'}
            />
          </Group>

          {/* AKSI */}
          <Group title="AKSI">
            <MenuItem
              icon="account-edit-outline"
              label="Ubah Profil"
              desc="Perbarui data pribadi"
              onPress={() => {}}
            />
            <MenuItem
              icon="lock-reset"
              label="Ubah Password"
              desc="Ganti kata sandi akun"
              onPress={() => {}}
            />
            <MenuItem
              icon="camera-outline"
              label="Verifikasi Foto"
              desc={
                user?.photo_verified_at
                  ? 'Foto sudah diverifikasi'
                  : 'Belum diverifikasi'
              }
              onPress={() => {}}
            />
            <MenuItem
              icon="cog-outline"
              label="Pengaturan"
              desc="Preferensi aplikasi"
              onPress={() => navigation.navigate('Setting')}
            />
          </Group>

          <Text style={styles.footer}>© 2025 Aplikasi Absensi v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ===== Sub-komponen ===== */

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.backBtn} />
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Profil Saya</Text>
          <Text style={styles.headerSubtitle}>Data pribadi pegawai</Text>
        </View>
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

function Group({ title, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color="#2563eb" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '-'}</Text>
      </View>
    </View>
  );
}

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

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  safe: { flex: 1 },

  /* ScrollView */
  scrollContent: {
    // paddingBottom diisi dinamis
  },

  /* ==== HEADER BIRU — DI DALAM SCROLL ==== */
  header: {
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 100,
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

  /* ==== CENTER LOADING / ERROR ==== */
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: { fontSize: 13, color: '#64748b' },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 8,
  },
  retryBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    paddingTop: 52,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: -40,            
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarWrap: {
    position: 'absolute',
    top: -46,                   
    alignSelf: 'center',
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#eff6ff',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#eff6ff',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#2563eb' },
  onlineDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
    textAlign: 'center',
  },
  position: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  /* Body setelah kartu */
  body: { paddingHorizontal: 16 },

  /* ==== GROUP ==== */
  group: { marginTop: 20 },
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

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  infoLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 2,
  },

  /* ==== MENU ITEM ==== */
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

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 20,
  },
});
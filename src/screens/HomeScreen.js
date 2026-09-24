import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
import CustomAlert from '../components/CustomAlert';
import RekapCard from '../components/RekapCard';
import { useHomeData } from '../hooks/useHomeData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 40;

/* Menu Utama */
const MENUS = [
  {
    id: 1,
    label: 'Pengajuan Cuti',
    icon: 'file-document-outline',
    color: '#dbeafe',
    iconColor: '#2563eb',
    screen: 'LeaveRequest',
  },
  {
    id: 2,
    label: 'Riwayat Absen',
    icon: 'chart-box',
    color: '#dcfce7',
    iconColor: '#16a34a',
    screen: 'Attendance',
  },
  {
    id: 3,
    label: 'Data Pegawai',
    icon: 'account-group',
    color: '#fef3c7',
    iconColor: '#d97706',
    screen : 'EmployeeList',
  },
  {
    id: 4,
    label: 'Reimburse',
    icon: 'cash-multiple',
    color: '#fce7f3',
    iconColor: '#db2777',
  },
  {
    id: 5,
    label: 'Berita',
    icon: 'newspaper-variant-outline',
    color: '#e0e7ff',
    iconColor: '#4f46e5',
  },
  {
    id: 6,
    label: 'Slip Gaji',
    icon: 'receipt-text-outline',
    color: '#f1f5f9',
    iconColor: '#475569',
  },
];

export default function HomeScreen({ navigation }) {
  const {
    userData,
    banners,
    todayAttendance,
    monthlyRecap,
    refreshing,
    loadingBanners,
    onRefresh,
  } = useHomeData();

  const [currentDay, setCurrentDay] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);

  const bannerScrollRef = useRef(null);
  const bannerTimer = useRef(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Batal',
    showCancel: false,
    onConfirm: null,
  });

  const showAlert = (config) =>
    setAlertConfig((prev) => ({ ...prev, ...config, visible: true }));
  const hideAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  /* ===== Fade-in animation ===== */
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

  /* ===== Clock (hari & tanggal realtime) ===== */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentDay(now.toLocaleDateString('id-ID', { weekday: 'long' }));
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ===== Auto slide banner ===== */
  useEffect(() => {
    if (banners.length <= 1) return;

    bannerTimer.current = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({
          x: next * BANNER_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(bannerTimer.current);
  }, [banners.length]);

  const handleBannerScroll = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    setActiveBanner(Math.round(offset / BANNER_WIDTH));
  };

  const handleBannerPress = (banner) => {
    if (banner.action_type === 'leave_request') {
      navigation?.navigate('LeaveRequest');
    } else if (banner.action_type === 'attendance') {
      navigation?.navigate('Attendance');
    } else if (banner.action_type === 'link' && banner.action_value) {
      showAlert({
        type: 'info',
        title: banner.title,
        message: `Membuka: ${banner.action_value}`,
      });
    } else {
      showAlert({
        type: 'info',
        title: banner.title,
        message: banner.subtitle || 'Tidak ada detail.',
      });
    }
  };

  /* ===== Logout (AsyncStorage v3 compatible) ===== */
  const handleLogout = () => {
    showAlert({
      type: 'confirm',
      title: 'Keluar Akun?',
      message: 'Apakah Anda yakin ingin keluar dari aplikasi ini?',
      confirmText: 'Keluar',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        console.log('🚪 Logging out...');

        // ✅ AsyncStorage v3 — pakai removeItem satu-satu
        try {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          console.log('✅ Storage cleared');
        } catch (e) {
          console.log('⚠️ Storage error:', e.message);
        }

        // Navigate to Login
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
      },
    });
  };

  const handleMenuPress = (menu) => {
    if (menu.screen) navigation?.navigate(menu.screen);
    else
      showAlert({
        type: 'info',
        title: menu.label,
        message: `Fitur ${menu.label} akan segera tersedia.`,
      });
  };

  /* ===== Derived values ===== */
  const displayName =
    userData?.employee?.full_name || userData?.name || 'Pengguna';

  const displayRole =
    userData?.employee?.position?.name ||
    userData?.employee?.position ||
    userData?.employee?.department?.name ||
    userData?.employee?.department ||
    userData?.role ||
    'Pegawai';

  const displayNumber = userData?.employee?.employee_number || null;
  const displayEmail = userData?.email || null;
  const photoUri = userData?.photo_url || userData?.photo || null;

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedBackground />
      </View>

      <SafeAreaView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        edges={['top']}
      >
        <Animated.View
          style={[
            styles.animatedContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScrollView
            style={{ backgroundColor: 'transparent' }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2563eb']}
                tintColor="#2563eb"
              />
            }
          >
            {/* ===== HEADER BIRU ===== */}
            <View style={styles.blueHeader}>
              <View style={styles.topRow}>
                <View style={styles.logoRowLeft}>
                  <View style={styles.logoBadge}>
                    <MaterialCommunityIcons
                      name="face-recognition"
                      size={22}
                      color="#ffffff"
                    />
                  </View>
                  <Text style={styles.logoText}>
                    Absensi<Text style={styles.logoTextBold}>One</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bellBtn}
                  onPress={() =>
                    showAlert({
                      type: 'info',
                      title: 'Notifikasi',
                      message: 'Belum ada notifikasi baru untuk Anda hari ini.',
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={20}
                    color="#ffffff"
                  />
                  <View style={styles.bellDot} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ===== PROFILE CARD ===== */}
            <View style={styles.profileCard}>
              <View style={styles.profilePhotoWrapper}>
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <View style={styles.profilePhotoPlaceholder}>
                    <Text style={styles.profilePhotoInitial}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.profileOnlineDot} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={styles.profileRoleRow}>
                  <MaterialCommunityIcons
                    name="badge-account-outline"
                    size={12}
                    color="#2563eb"
                  />
                  <Text style={styles.profileRole} numberOfLines={1}>
                    {displayRole}
                  </Text>
                </View>
                {displayNumber ? (
                  <View style={styles.profileNumberRow}>
                    <MaterialCommunityIcons
                      name="identifier"
                      size={11}
                      color="#94a3b8"
                    />
                    <Text style={styles.profileNumber}>{displayNumber}</Text>
                  </View>
                ) : displayEmail ? (
                  <View style={styles.profileNumberRow}>
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={11}
                      color="#94a3b8"
                    />
                    <Text style={styles.profileNumber} numberOfLines={1}>
                      {displayEmail}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={18}
                  color="#16a34a"
                />
              </View>
            </View>

            {/* ===== CARD JAM ===== */}
            <View style={styles.clockCard}>
              <View style={styles.clockHeader}>
                <View style={styles.clockLeft}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={18}
                    color="#2563eb"
                  />
                  <Text style={styles.clockLabel}>
                    {todayAttendance?.work_schedule?.name || 'Regular'}
                  </Text>
                </View>
                <View style={styles.clockRight}>
                  <Text style={styles.dayText}>{currentDay}</Text>
                  <Text style={styles.dateText}>{currentDate}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.clockBody}>
                <View style={styles.clockCol}>
                  <View style={styles.clockColHeader}>
                    <MaterialCommunityIcons
                      name="login"
                      size={16}
                      color="#16a34a"
                    />
                    <Text style={styles.clockColLabel}>Masuk</Text>
                  </View>
                  {todayAttendance?.check_in ? (
                    <View style={styles.clockStatusRow}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={13}
                        color="#16a34a"
                      />
                      <Text style={styles.clockColSubGreen}>
                        {String(todayAttendance.check_in).substring(0, 5)} WIB
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.clockColSub}>Belum absen</Text>
                  )}
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.clockCol}>
                  <View style={styles.clockColHeader}>
                    <MaterialCommunityIcons
                      name="logout"
                      size={16}
                      color="#db2777"
                    />
                    <Text style={styles.clockColLabel}>Pulang</Text>
                  </View>
                  {todayAttendance?.check_out ? (
                    <View style={styles.clockStatusRow}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={13}
                        color="#db2777"
                      />
                      <Text style={styles.clockColSubPink}>
                        {String(todayAttendance.check_out).substring(0, 5)} WIB
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.clockColSub}>Belum absen</Text>
                  )}
                </View>
              </View>

              {todayAttendance?.status && (
                <View
                  style={[
                    styles.statusBadgeCard,
                    todayAttendance.status === 'hadir' && {
                      backgroundColor: '#dcfce7',
                    },
                    todayAttendance.status === 'terlambat' && {
                      backgroundColor: '#fef3c7',
                    },
                    todayAttendance.status === 'izin' && {
                      backgroundColor: '#dbeafe',
                    },
                    todayAttendance.status === 'sakit' && {
                      backgroundColor: '#fee2e2',
                    },
                    todayAttendance.status === 'cuti' && {
                      backgroundColor: '#ede9fe',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      todayAttendance.status === 'hadir'
                        ? 'check-circle'
                        : todayAttendance.status === 'terlambat'
                        ? 'clock-alert'
                        : 'information'
                    }
                    size={14}
                    color={
                      todayAttendance.status === 'hadir'
                        ? '#16a34a'
                        : todayAttendance.status === 'terlambat'
                        ? '#d97706'
                        : '#2563eb'
                    }
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      todayAttendance.status === 'hadir' && {
                        color: '#16a34a',
                      },
                      todayAttendance.status === 'terlambat' && {
                        color: '#d97706',
                      },
                      todayAttendance.status === 'izin' && {
                        color: '#2563eb',
                      },
                      todayAttendance.status === 'sakit' && {
                        color: '#dc2626',
                      },
                      todayAttendance.status === 'cuti' && {
                        color: '#7c3aed',
                      },
                    ]}
                  >
                    {todayAttendance.status === 'hadir' && 'Hadir'}
                    {todayAttendance.status === 'terlambat' &&
                      `Terlambat ${todayAttendance.late_minutes || 0} menit`}
                    {todayAttendance.status === 'izin' && 'Izin'}
                    {todayAttendance.status === 'sakit' && 'Sakit'}
                    {todayAttendance.status === 'cuti' && 'Cuti'}
                  </Text>
                </View>
              )}
            </View>

            {/* ===== BANNER SLIDER ===== */}
            <View style={styles.bannerWrapper}>
              {loadingBanners ? (
                <View style={styles.bannerLoading}>
                  <ActivityIndicator color="#2563eb" />
                </View>
              ) : banners.length === 0 ? (
                <View style={styles.bannerEmpty}>
                  <MaterialCommunityIcons
                    name="image-off-outline"
                    size={32}
                    color="#cbd5e1"
                  />
                  <Text style={styles.bannerEmptyText}>Belum ada banner</Text>
                </View>
              ) : (
                <>
                  <ScrollView
                    ref={bannerScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleBannerScroll}
                    scrollEventThrottle={16}
                    style={styles.bannerScroll}
                  >
                    {banners.map((banner) => (
                      <TouchableOpacity
                        key={banner.id}
                        style={[
                          styles.banner,
                          { backgroundColor: banner.color || '#2563eb' },
                        ]}
                        onPress={() => handleBannerPress(banner)}
                        activeOpacity={0.85}
                      >
                        {banner.image_url && (
                          <Image
                            source={{ uri: banner.image_url }}
                            style={styles.bannerImage}
                            resizeMode="cover"
                          />
                        )}
                        <View
                          style={[
                            styles.bannerOverlay,
                            {
                              backgroundColor: banner.image_url
                                ? 'rgba(15, 23, 42, 0.45)'
                                : 'transparent',
                            },
                          ]}
                        >
                          <View style={styles.bannerContent}>
                            {banner.type && (
                              <View style={styles.bannerTypeBadge}>
                                <Text style={styles.bannerTypeText}>
                                  {banner.type.toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <Text
                              style={styles.bannerTitle}
                              numberOfLines={1}
                            >
                              {banner.title}
                            </Text>
                            {banner.subtitle ? (
                              <Text
                                style={styles.bannerSubtitle}
                                numberOfLines={2}
                              >
                                {banner.subtitle}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.bannerArrow}>
                            <MaterialCommunityIcons
                              name="arrow-right"
                              size={20}
                              color="#ffffff"
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {banners.length > 1 && (
                    <View style={styles.dotsContainer}>
                      {banners.map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            i === activeBanner && styles.dotActive,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* ===== REKAP (dari backend) ===== */}
            <RekapCard data={monthlyRecap} />

            {/* ===== MENU UTAMA ===== */}
            <Text style={styles.sectionTitle}>Menu Utama</Text>
            <View style={styles.menuCard}>
              <View style={styles.menuGrid}>
                {MENUS.map((menu) => (
                  <TouchableOpacity
                    key={menu.id}
                    style={styles.menuItem}
                    onPress={() => handleMenuPress(menu)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuIconWrap,
                        { backgroundColor: menu.color },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={menu.icon}
                        size={26}
                        color={menu.iconColor}
                      />
                    </View>
                    <Text style={styles.menuLabel}>{menu.label}</Text>
                  </TouchableOpacity>
                ))}

                {/* Menu khusus admin */}
                {userData?.role === 'admin' && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation?.navigate('RadiusSetting')}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuIconWrap,
                        { backgroundColor: '#e0f2fe' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="map-marker-radius"
                        size={26}
                        color="#0284c7"
                      />
                    </View>
                    <Text style={styles.menuLabel}>Setting Radius</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ===== LOGOUT ===== */}
            <TouchableOpacity
              style={styles.logoutRow}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="logout"
                size={18}
                color="#ef4444"
              />
              <Text style={styles.logoutText}>Keluar dari Akun</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={hideAlert}
      />
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  container: { flex: 1, backgroundColor: 'transparent' },
  animatedContent: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 40, backgroundColor: 'transparent' },

  /* HEADER */
  blueHeader: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  logoTextBold: { fontWeight: '800' },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#facc15',
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },

  /* PROFILE */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -60,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  profilePhotoWrapper: { position: 'relative', marginRight: 14 },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#dbeafe',
  },
  profilePhotoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#bfdbfe',
  },
  profilePhotoInitial: { color: '#2563eb', fontSize: 28, fontWeight: '800' },
  profileOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  profileRole: { fontSize: 12, color: '#2563eb', fontWeight: '700' },
  profileNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  profileNumber: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  verifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CARD JAM */
  clockCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clockLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clockLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  clockRight: { alignItems: 'flex-end' },
  dayText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  dateText: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  clockBody: { flexDirection: 'row', alignItems: 'center' },
  clockCol: { flex: 1 },
  clockColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  clockColLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  clockColSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    fontStyle: 'italic',
  },
  clockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clockColSubGreen: { fontSize: 12, color: '#16a34a', fontWeight: '700' },
  clockColSubPink: { fontSize: 12, color: '#db2777', fontWeight: '700' },
  verticalDivider: { width: 1, height: 50, backgroundColor: '#f1f5f9' },

  statusBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  /* BANNER */
  bannerWrapper: { marginTop: 16, marginBottom: 4 },
  bannerScroll: { paddingHorizontal: 20 },
  banner: {
    width: BANNER_WIDTH,
    height: 140,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    flex: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bannerContent: { flex: 1, paddingRight: 10 },
  bannerTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  bannerTypeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 17,
  },
  bannerArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerLoading: {
    height: 140,
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerEmpty: {
    height: 140,
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bannerEmptyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  dotActive: { width: 20, backgroundColor: '#2563eb' },

  /* MENU */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: { width: '31%', alignItems: 'center', marginBottom: 16 },
  menuIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  menuLabel: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
  },

  /* LOGOUT */
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fee2e2',
    borderRadius: 14,
  },
  logoutText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
});
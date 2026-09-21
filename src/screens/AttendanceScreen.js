import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedBackground from '../components/AnimatedBackground';
import CustomAlert from '../components/CustomAlert';
import { attendanceApi } from '../services/api';

/* ===== Helper: Convert file URI → base64 ===== */
const uriToBase64 = async (uri) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = uri.split('.').pop().toLowerCase();
  const mime = ext === 'png' ? 'png' : 'jpeg';
  return `data:image/${mime};base64,${base64}`;
};

/* ===== Helper: Haversine distance (meter) ===== */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function AttendanceScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('masuk');
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [distanceToOffice, setDistanceToOffice] = useState(null);
  const cameraRef = useRef(null);

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
    setAlertConfig((p) => ({ ...p, ...config, visible: true }));
  const hideAlert = () => setAlertConfig((p) => ({ ...p, visible: false }));

  /* ===== 1. Fetch work schedule (radius info) ===== */
  useEffect(() => {
    (async () => {
      try {
        const res = await attendanceApi.scheduleInfo();
        const info = res.data?.data?.work_schedule || null;
        setScheduleInfo(info);
        console.log('📅 Schedule info:', info);
      } catch (e) {
        console.log('⚠️ schedule info error:', e.message);
      }
    })();
  }, []);

  /* ===== 2. Ambil lokasi ===== */
  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      setLoadingLocation(true);
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync();
          status = req.status;
        }

        if (status !== 'granted') {
          if (isMounted) {
            showAlert({
              type: 'warning',
              title: 'Izin Lokasi Ditolak',
              message: 'Aplikasi butuh izin lokasi. Aktifkan di Settings HP.',
            });
          }
          return;
        }

        const gpsOn = await Location.hasServicesEnabledAsync();
        if (!gpsOn) {
          if (isMounted) {
            showAlert({
              type: 'warning',
              title: 'GPS Tidak Aktif',
              message: 'Aktifkan GPS di pengaturan HP Anda.',
            });
          }
          return;
        }

        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (!loc) throw new Error('Lokasi tidak terdeteksi');

        // Reverse geocode
        let address = 'Lokasi terdeteksi';
        let city = 'Lokasi Anda';

        try {
          const results = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          if (results && results.length > 0) {
            const a = results[0];
            const parts = [
              a.street || a.name,
              a.streetNumber,
              a.district || a.subregion,
              a.city,
            ].filter(Boolean);
            address = parts.join(', ') || 'Lokasi terdeteksi';
            city = a.city || a.subregion || a.region || 'Lokasi Anda';
          }
        } catch (e) {
          console.log('Reverse geocode error:', e);
          address = `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`;
        }

        if (isMounted) {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            address,
            city,
          });
        }
      } catch (e) {
        console.log('Location error:', e);
        if (isMounted) {
          showAlert({
            type: 'error',
            title: 'Gagal Ambil Lokasi',
            message: e.message,
          });
        }
      } finally {
        if (isMounted) setLoadingLocation(false);
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ===== 3. Hitung jarak ke kantor ===== */
  useEffect(() => {
    if (
      location &&
      scheduleInfo?.latitude &&
      scheduleInfo?.longitude
    ) {
      const dist = haversineDistance(
        location.latitude,
        location.longitude,
        Number(scheduleInfo.latitude),
        Number(scheduleInfo.longitude)
      );
      setDistanceToOffice(Math.round(dist));
    } else {
      setDistanceToOffice(null);
    }
  }, [location, scheduleInfo]);

  const isWithinRadius =
    distanceToOffice !== null &&
    scheduleInfo?.radius_meters &&
    distanceToOffice <= scheduleInfo.radius_meters;

  /* ===== Permission kamera ===== */
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <AnimatedBackground />
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.permissionBox}>
            <MaterialCommunityIcons name="camera-off" size={64} color="#94a3b8" />
            <Text style={styles.permTitle}>Akses Kamera Dibutuhkan</Text>
            <Text style={styles.permSub}>
              Untuk melakukan absensi, aplikasi memerlukan akses kamera.
            </Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Izinkan Kamera</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  /* ===== Handle capture ===== */
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: false,
      });
      setPhoto(result.uri);
    } catch (e) {
      showAlert({
        type: 'error',
        title: 'Gagal Ambil Foto',
        message: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ===== Handle submit ===== */
  const handleSubmit = async () => {
    if (!photo) {
      return showAlert({
        type: 'warning',
        title: 'Foto Belum Ada',
        message: 'Ambil foto wajah terlebih dahulu.',
      });
    }
    if (!location) {
      return showAlert({
        type: 'warning',
        title: 'Lokasi Belum Terdeteksi',
        message: 'Tunggu GPS mendeteksi lokasi Anda.',
      });
    }
    if (distanceToOffice !== null && !isWithinRadius) {
      return showAlert({
        type: 'error',
        title: 'Di Luar Radius Absen',
        message: `Anda ${distanceToOffice}m dari kantor. Maksimal ${scheduleInfo?.radius_meters}m.`,
      });
    }

    setLoading(true);
    try {
      const base64Photo = await uriToBase64(photo);

      const payload = {
        latitude: location.latitude,
        longitude: location.longitude,
        notes: '',
        photo: base64Photo,
      };

      console.log(`📤 POST /attendance/check-${mode === 'masuk' ? 'in' : 'out'}`);

      let response;
      if (mode === 'masuk') {
        response = await attendanceApi.checkIn(payload);
      } else {
        response = await attendanceApi.checkOut(payload);
      }

      console.log('✅ Success:', response.data);

      showAlert({
        type: 'success',
        title: `Absen ${mode === 'masuk' ? 'Masuk' : 'Pulang'} Berhasil!`,
        message: `Tercatat pada ${new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })}\n📍 ${location.address}`,
        confirmText: 'Selesai',
        onConfirm: () => {
          setPhoto(null);
          navigation.navigate('Home');
        },
      });
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.data?.errors
          ? Object.values(e.response.data.errors).flat().join('\n')
          : e.message);

      console.log('❌ Error:', e.response?.data);

      showAlert({
        type: 'error',
        title: 'Gagal Absen',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => setPhoto(null);

  /* ===== RENDER ===== */
  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Absensi Wajah</Text>
            <Text style={styles.subtitle}>
              Posisikan wajah Anda di dalam lingkaran
            </Text>
          </View>

          {/* Toggle Masuk/Pulang */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'masuk' && styles.toggleActive]}
              onPress={() => setMode('masuk')}
            >
              <MaterialCommunityIcons
                name="login"
                size={18}
                color={mode === 'masuk' ? '#ffffff' : '#64748b'}
              />
              <Text
                style={[
                  styles.toggleText,
                  mode === 'masuk' && styles.toggleTextActive,
                ]}
              >
                Masuk
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'pulang' && styles.toggleActive]}
              onPress={() => setMode('pulang')}
            >
              <MaterialCommunityIcons
                name="logout"
                size={18}
                color={mode === 'pulang' ? '#ffffff' : '#64748b'}
              />
              <Text
                style={[
                  styles.toggleText,
                  mode === 'pulang' && styles.toggleTextActive,
                ]}
              >
                Pulang
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card Lokasi + Radius */}
          <View style={styles.locationCard}>
            <MaterialCommunityIcons
              name={loadingLocation ? 'crosshairs-gps' : 'map-marker-check'}
              size={20}
              color={loadingLocation ? '#f59e0b' : '#16a34a'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>
                {loadingLocation ? 'Mendeteksi lokasi...' : 'Lokasi Anda'}
              </Text>
              <Text style={styles.locationValue} numberOfLines={2}>
                {location?.address || 'Menunggu GPS...'}
              </Text>
            </View>
          </View>

          {/* Card Radius */}
          {scheduleInfo && (
            <View
              style={[
                styles.radiusCard,
                distanceToOffice === null && styles.radiusCardLoading,
                distanceToOffice !== null &&
                  isWithinRadius &&
                  styles.radiusCardIn,
                distanceToOffice !== null &&
                  !isWithinRadius &&
                  styles.radiusCardOut,
              ]}
            >
              <View
                style={[
                  styles.radiusIconWrap,
                  distanceToOffice === null && { backgroundColor: '#fef3c7' },
                  isWithinRadius && { backgroundColor: '#dcfce7' },
                  distanceToOffice !== null &&
                    !isWithinRadius && { backgroundColor: '#fee2e2' },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    distanceToOffice === null
                      ? 'crosshairs'
                      : isWithinRadius
                      ? 'map-marker-radius'
                      : 'map-marker-alert'
                  }
                  size={22}
                  color={
                    distanceToOffice === null
                      ? '#d97706'
                      : isWithinRadius
                      ? '#16a34a'
                      : '#dc2626'
                  }
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.radiusTitle,
                    distanceToOffice === null && { color: '#d97706' },
                    isWithinRadius && { color: '#16a34a' },
                    distanceToOffice !== null &&
                      !isWithinRadius && { color: '#dc2626' },
                  ]}
                >
                  {distanceToOffice === null
                    ? 'Menghitung jarak...'
                    : isWithinRadius
                    ? '✅ Dalam Radius Absen'
                    : '❌ Di Luar Radius Absen'}
                </Text>

                <Text style={styles.radiusSub}>
                  {distanceToOffice !== null
                    ? `${distanceToOffice}m dari ${scheduleInfo.location_name || 'kantor'} · maks ${scheduleInfo.radius_meters}m`
                    : `${scheduleInfo.location_name || 'Kantor'} · radius ${scheduleInfo.radius_meters}m`}
                </Text>
              </View>
            </View>
          )}

          {/* Kamera / Preview */}
          <View style={styles.cameraWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.camera} />
            ) : (
              <CameraView ref={cameraRef} style={styles.camera} facing="front" />
            )}

            {!photo && (
              <View pointerEvents="none" style={styles.overlay}>
                <View style={styles.faceCircle} />
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </View>
            )}
          </View>

          {/* Tombol aksi */}
          <View style={styles.actionRow}>
            {photo ? (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={handleRetake}
                >
                  <MaterialCommunityIcons
                    name="camera-retake"
                    size={22}
                    color="#334155"
                  />
                  <Text style={styles.btnSecondaryText}>Ulangi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    !isWithinRadius && distanceToOffice !== null && { opacity: 0.5 },
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || (distanceToOffice !== null && !isWithinRadius)}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color="#ffffff"
                      />
                      <Text style={styles.btnPrimaryText}>Kirim Absen</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handleCapture}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <MaterialCommunityIcons
                    name="camera-iris"
                    size={38}
                    color="#ffffff"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.hint}>
            {photo
              ? 'Periksa foto Anda, lalu kirim untuk absen'
              : 'Tekan tombol kamera untuk mengambil foto absen'}
          </Text>
        </ScrollView>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Permission */
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 16,
  },
  permSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  permBtn: {
    marginTop: 24,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  /* Header */
  header: { marginTop: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  /* Toggle */
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  toggleActive: { backgroundColor: '#3b82f6' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#ffffff' },

  /* Location card */
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  locationValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 2,
  },

  /* Radius card */
  radiusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  radiusCardLoading: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  radiusCardIn: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  radiusCardOut: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  radiusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusTitle: { fontSize: 13, fontWeight: '800' },
  radiusSub: { fontSize: 11, color: '#64748b', marginTop: 2 },

  /* Camera */
  cameraWrap: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
    marginBottom: 4,
  },
  camera: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  faceCircle: {
    width: 170,
    height: 220,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderStyle: 'dashed',
  },
  cornerTL: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 26,
    height: 26,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#3b82f6',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 26,
    height: 26,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#3b82f6',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 26,
    height: 26,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#3b82f6',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 26,
    height: 26,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#3b82f6',
    borderBottomRightRadius: 8,
  },

  /* Action */
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
    gap: 12,
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnPrimaryText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnSecondaryText: { color: '#334155', fontWeight: '700', fontSize: 14 },

  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 8,
  },
});
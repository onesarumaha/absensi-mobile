import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../components/AnimatedBackground';
import CustomAlert from '../components/CustomAlert';
import { authApi } from '../services/api';

const uriToBase64 = async (uri) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = uri.split('.').pop().toLowerCase();
  const mime = ext === 'png' ? 'png' : 'jpeg';
  return `data:image/${mime};base64,${base64}`;
};

export default function SetupPhotoScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false, type: 'info', title: '', message: '', onConfirm: null,
  });
  const showAlert = (c) => setAlertConfig((p) => ({ ...p, ...c, visible: true }));
  const hideAlert = () => setAlertConfig((p) => ({ ...p, visible: false }));

  if (!permission?.granted) {
    return (
      <View style={styles.root}>
        <AnimatedBackground />
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <MaterialCommunityIcons name="camera-off" size={64} color="#94a3b8" />
            <Text style={styles.title}>Akses Kamera Dibutuhkan</Text>
            <Text style={styles.subtitle}>
              Untuk mengatur foto profil, aplikasi butuh akses kamera.
            </Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Izinkan Kamera</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      setPhoto(result.uri);
    } catch (e) {
      showAlert({ type: 'error', title: 'Gagal Ambil Foto', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const base64 = await uriToBase64(photo);
      console.log('📤 Upload photo, size:', base64.length);

      const response = await authApi.uploadPhoto(base64);
      console.log('✅ Response:', response.data);

      showAlert({
        type: 'success',
        title: 'Foto Profil Tersimpan!',
        message: 'Wajah terverifikasi. Sekarang Anda bisa mulai absen.',
        confirmText: 'Mulai',
        onConfirm: () => navigation.replace('Main'),
      });
    } catch (e) {
      console.log('❌ Upload error:', e.response?.data);
      const msg = e.response?.data?.message || e.message;
      showAlert({ type: 'error', title: 'Gagal Simpan', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="account-circle" size={50} color="#2563eb" />
          <Text style={styles.title}>Ambil Foto Profil</Text>
          <Text style={styles.subtitle}>
            Foto ini akan jadi pembanding saat Anda absen. Pastikan wajah terlihat jelas & hanya Anda sendiri.
          </Text>
        </View>

        <View style={styles.cameraWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.camera} />
          ) : (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          )}
          {!photo && (
            <View pointerEvents="none" style={styles.overlay}>
              <View style={styles.faceCircle} />
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          {photo ? (
            <>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => setPhoto(null)}
              >
                <MaterialCommunityIcons name="camera-retake" size={22} color="#334155" />
                <Text style={styles.btnSecondaryText}>Ulangi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                    <Text style={styles.btnPrimaryText}>Simpan</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={handleCapture}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <MaterialCommunityIcons name="camera-iris" size={38} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText || 'OK'}
        onConfirm={alertConfig.onConfirm}
        onClose={hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  safe: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 16, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  cameraWrap: { height: 360, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1e293b', position: 'relative' },
  camera: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  faceCircle: {
    width: 200, height: 260, borderRadius: 130,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderStyle: 'dashed',
  },
  actionRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 12 },
  captureBtn: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: '#fff',
    shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  btnSecondaryText: { color: '#334155', fontWeight: '700' },
  permBtn: { marginTop: 24, backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
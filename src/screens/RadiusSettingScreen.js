import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedBackground from '../components/AnimatedBackground';
import CustomAlert from '../components/CustomAlert';
import { workScheduleApi } from '../services/api';

const RADIUS_PRESETS = [
  { value: 50, label: '50 m' },
  { value: 100, label: '100 m' },
  { value: 200, label: '200 m' },
  { value: 500, label: '500 m' },
];

/* ===== Komponen Modal Form ===== */
function ScheduleFormModal({
  visible,
  onClose,
  onSubmit,
  loading,
  initialData,
}) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [lateTolerance, setLateTolerance] = useState('0');
  const [radius, setRadius] = useState(100);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loadingGPS, setLoadingGPS] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setStartTime(initialData.start_time?.substring(0, 5) || '08:00');
      setEndTime(initialData.end_time?.substring(0, 5) || '17:00');
      setLateTolerance(String(initialData.late_tolerance ?? 0));
      setRadius(initialData.radius_meters ?? 100);
      setLocationName(initialData.location_name || '');
      setLatitude(initialData.latitude ? String(initialData.latitude) : '');
      setLongitude(initialData.longitude ? String(initialData.longitude) : '');
    } else {
      setName('');
      setStartTime('08:00');
      setEndTime('17:00');
      setLateTolerance('0');
      setRadius(100);
      setLocationName('');
      setLatitude('');
      setLongitude('');
    }
  }, [initialData, visible]);

  const handleGPS = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(loc.coords.latitude.toFixed(7));
      setLongitude(loc.coords.longitude.toFixed(7));

      try {
        const [addr] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (addr && !locationName) {
          setLocationName(addr.street || addr.name || 'Kantor');
        }
      } catch {}
    } catch (e) {
      console.log('GPS error:', e);
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (!startTime || !endTime) return;

    onSubmit({
      name: name.trim(),
      start_time: startTime,
      end_time: endTime,
      late_tolerance: parseInt(lateTolerance || '0', 10),
      radius_meters: parseInt(radius || '100', 10),
      location_name: locationName,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {initialData ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
            </Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Nama Jadwal</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Shift Pagi"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            <View style={{ height: 12 }} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Jam Masuk</Text>
                <TextInput
                  style={styles.input}
                  placeholder="08:00"
                  placeholderTextColor="#94a3b8"
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Jam Pulang</Text>
                <TextInput
                  style={styles.input}
                  placeholder="17:00"
                  placeholderTextColor="#94a3b8"
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>

            <View style={{ height: 12 }} />

            <Text style={styles.inputLabel}>Toleransi Telat (menit)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#94a3b8"
              value={lateTolerance}
              onChangeText={(t) =>
                setLateTolerance(t.replace(/[^0-9]/g, ''))
              }
              keyboardType="number-pad"
            />

            <View style={{ height: 12 }} />

            <Text style={styles.inputLabel}>Nama Lokasi</Text>
            <TextInput
              style={styles.input}
              placeholder="Kantor Pusat"
              placeholderTextColor="#94a3b8"
              value={locationName}
              onChangeText={setLocationName}
            />

            <View style={{ height: 12 }} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  placeholder="-6.175392"
                  placeholderTextColor="#94a3b8"
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  placeholder="106.827153"
                  placeholderTextColor="#94a3b8"
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ height: 8 }} />

            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGPS}
              disabled={loadingGPS}
            >
              {loadingGPS ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="crosshairs-gps"
                    size={18}
                    color="#2563eb"
                  />
                  <Text style={styles.gpsBtnText}>Pakai GPS Sekarang</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            <Text style={styles.inputLabel}>Radius (meter)</Text>
            <View style={styles.presetRow}>
              {RADIUS_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.presetItem,
                    radius === p.value && styles.presetItemActive,
                  ]}
                  onPress={() => setRadius(p.value)}
                >
                  <Text
                    style={[
                      styles.presetValue,
                      radius === p.value && { color: '#ffffff' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="100"
              placeholderTextColor="#94a3b8"
              value={String(radius)}
              onChangeText={(t) => {
                const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                setRadius(isNaN(n) ? 0 : n);
              }}
              keyboardType="number-pad"
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={onClose}
            >
              <Text style={styles.modalBtnCancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnSave]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalBtnSaveText}>
                  {initialData ? 'Update' : 'Tambah'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ===== MAIN SCREEN ===== */
export default function RadiusSettingScreen({ navigation }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

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
  const showAlert = (c) =>
    setAlertConfig((p) => ({ ...p, ...c, visible: true }));
  const hideAlert = () => setAlertConfig((p) => ({ ...p, visible: false }));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await workScheduleApi.list();
      const list = res.data?.data ?? res.data ?? [];
      setSchedules(Array.isArray(list) ? list : []);
    } catch (e) {
      console.log('Load error:', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  /* Tambah / Edit */
  const handleOpenCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditing(item);
    setShowModal(true);
  };

  const handleSubmitForm = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        // Update
        const res = await workScheduleApi.update(editing.id, payload);
        const updated = res.data?.data;
        setSchedules((prev) =>
          prev.map((s) => (s.id === editing.id ? updated : s))
        );
        setShowModal(false);
        showAlert({
          type: 'success',
          title: 'Berhasil!',
          message: 'Jadwal berhasil diperbarui.',
        });
      } else {
        // Create
        const res = await workScheduleApi.create(payload);
        const created = res.data?.data;
        setSchedules((prev) => [...prev, created]);
        setShowModal(false);
        showAlert({
          type: 'success',
          title: 'Berhasil!',
          message: 'Jadwal baru berhasil ditambahkan.',
        });
      }
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.response?.data?.errors
          ? Object.values(e.response.data.errors).flat().join('\n')
          : e.message);
      showAlert({ type: 'error', title: 'Gagal Simpan', message: msg });
    } finally {
      setSaving(false);
    }
  };

  /* Hapus */
  const handleDelete = (item) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Jadwal?',
      message: `Yakin ingin menghapus "${item.name}"?\n\nTindakan ini tidak bisa dibatalkan.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          await workScheduleApi.destroy(item.id);
          setSchedules((prev) => prev.filter((s) => s.id !== item.id));
          showAlert({
            type: 'success',
            title: 'Berhasil Dihapus',
            message: `Jadwal "${item.name}" telah dihapus.`,
          });
        } catch (e) {
          const msg = e.response?.data?.message || e.message;
          showAlert({ type: 'error', title: 'Gagal Hapus', message: msg });
        }
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <AnimatedBackground />
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator color="#2563eb" size="large" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={20}
                color="#334155"
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Setting Radius</Text>
              <Text style={styles.subtitle}>
                {schedules.length} jadwal terdaftar
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleOpenCreate}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* List Schedule */}
          <Text style={styles.sectionTitle}>Daftar Jadwal Kerja</Text>

          {schedules.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={48}
                color="#cbd5e1"
              />
              <Text style={styles.emptyText}>
                Belum ada jadwal. Tap + untuk menambah.
              </Text>
            </View>
          ) : (
            schedules.map((s) => (
              <View key={s.id} style={styles.scheduleCard}>
                <View style={styles.scheduleCardHeader}>
                  <View style={styles.scheduleIconWrap}>
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={20}
                      color="#2563eb"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleName}>{s.name}</Text>
                    <Text style={styles.scheduleTime}>
                      {s.start_time?.substring(0, 5)} -{' '}
                      {s.end_time?.substring(0, 5)}
                    </Text>
                  </View>
                </View>

                <View style={styles.scheduleCardBody}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={14}
                      color="#64748b"
                    />
                    <Text style={styles.infoText}>
                      {s.location_name || 'Belum diset'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="map-marker-radius"
                      size={14}
                      color="#64748b"
                    />
                    <Text style={styles.infoText}>
                      Radius: {s.radius_meters || 100}m
                    </Text>
                  </View>
                  {s.latitude && s.longitude ? (
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons
                        name="crosshairs-gps"
                        size={14}
                        color="#64748b"
                      />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {Number(s.latitude).toFixed(5)},{' '}
                        {Number(s.longitude).toFixed(5)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.scheduleCardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleOpenEdit(s)}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={14}
                      color="#2563eb"
                    />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(s)}
                  >
                    <MaterialCommunityIcons
                      name="trash-can"
                      size={14}
                      color="#dc2626"
                    />
                    <Text style={styles.deleteBtnText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal Form */}
      <ScheduleFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitForm}
        loading={saving}
        initialData={editing}
      />

      {/* Alert */}
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

/* ===== Styles ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 13 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
    marginTop: 4,
  },

  /* Empty */
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },

  /* Schedule card */
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  scheduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  scheduleTime: { fontSize: 11, color: '#64748b', marginTop: 2 },

  scheduleCardBody: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 11, color: '#475569', flex: 1 },

  scheduleCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtn: { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  deleteBtn: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: '#dc2626' },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnCancel: { backgroundColor: '#f1f5f9' },
  modalBtnCancelText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  modalBtnSave: { backgroundColor: '#3b82f6' },
  modalBtnSaveText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

  /* Form */
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  row: { flexDirection: 'row' },

  gpsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  gpsBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '700' },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetItem: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  presetItemActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  presetValue: { fontSize: 13, fontWeight: '800', color: '#334155' },
});
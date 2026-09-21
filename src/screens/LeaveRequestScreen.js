import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
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
import { leaveApi } from '../services/api';

/* ===== Jenis Pengajuan (sesuai enum backend: izin, sakit, cuti) ===== */
const LEAVE_TYPES = [
  { key: 'cuti', label: 'Cuti', icon: 'calendar-star', color: '#2563eb', bg: '#dbeafe' },
  { key: 'sakit', label: 'Sakit', icon: 'medical-bag', color: '#dc2626', bg: '#fee2e2' },
  { key: 'izin', label: 'Izin', icon: 'account-clock', color: '#d97706', bg: '#fef3c7' },
];

/* ===== Config Status ===== */
const STATUS_CONFIG = {
  pending: { label: 'Menunggu', color: '#d97706', bg: '#fef3c7', icon: 'clock-outline' },
  approved: { label: 'Disetujui', color: '#16a34a', bg: '#dcfce7', icon: 'check-circle' },
  rejected: { label: 'Ditolak', color: '#dc2626', bg: '#fee2e2', icon: 'close-circle' },
};

/* ===== Helper ===== */
const toBackendDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplayDate = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const hitungHari = (startIso, endIso) => {
  if (!startIso || !endIso) return 0;
  const s = new Date(startIso);
  const e = new Date(endIso);
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
};

/* ===== Date Picker Modal ===== */
function DateInput({ label, value, onChange, icon = 'calendar' }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name={icon} size={18} color="#64748b" />
        <Text style={[styles.inputText, !value && { color: '#94a3b8' }]}>
          {value ? formatDisplayDate(value) : 'Pilih tanggal'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color="#94a3b8" />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pilih Tanggal</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {Array.from({ length: 90 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const iso = toBackendDate(d);
                const isSelected = value === iso;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dateOption,
                      isSelected && styles.dateOptionActive,
                    ]}
                    onPress={() => {
                      onChange(iso);
                      setShowPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        isSelected && { color: '#ffffff' },
                      ]}
                    >
                      {d.toLocaleDateString('id-ID', { weekday: 'long' })},{' '}
                      {formatDisplayDate(iso)}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={18} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ===== MAIN SCREEN ===== */
export default function LeaveRequestScreen() {
  const [leaveType, setLeaveType] = useState('cuti');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const scrollRef = useRef(null);

  /* Alert */
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
  const hideAlert = () =>
    setAlertConfig((p) => ({ ...p, visible: false }));

  /* ===== Load riwayat ===== */
  const loadHistory = async (showLoading = true) => {
    if (showLoading) setLoadingHistory(true);
    try {
      const response = await leaveApi.myRequests();
      const list = response.data?.data ?? response.data ?? [];
      setHistory(Array.isArray(list) ? list : []);
    } catch (e) {
      console.log(
        '❌ Load history error:',
        e.response?.status,
        e.response?.data || e.message
      );
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory(false);
  };

  /* ===== Reset form ===== */
  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setReason('');
    setLeaveType('cuti');
    setEditingId(null);
  };

  /* ===== Masuk mode edit ===== */
  const handleEdit = (item) => {
    setEditingId(item.id);
    setLeaveType(item.type);
    setStartDate(item.start_date?.split('T')[0] || item.start_date);
    setEndDate(item.end_date?.split('T')[0] || item.end_date);
    setReason(item.reason || '');

    // Scroll ke atas
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  /* ===== Hapus pengajuan ===== */
  const handleDelete = (item) => {
    showAlert({
      type: 'confirm',
      title: 'Batalkan Pengajuan?',
      message: `Yakin ingin menghapus pengajuan ${formatDisplayDate(
        item.start_date
      )}?\n\nTindakan ini tidak bisa dibatalkan.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          const response = await leaveApi.destroy(item.id);
          console.log('✅ Deleted:', response.data);

          if (editingId === item.id) resetForm();

          showAlert({
            type: 'success',
            title: 'Berhasil Dihapus',
            message: 'Pengajuan cuti telah dibatalkan.',
            onConfirm: () => loadHistory(),
          });
        } catch (e) {
          const msg = e.response?.data?.message || e.message;
          showAlert({
            type: 'error',
            title: 'Gagal Hapus',
            message: msg,
          });
        }
      },
    });
  };

  /* ===== Submit (create / update) ===== */
  const handleSubmit = () => {
    if (!startDate || !endDate) {
      return showAlert({
        type: 'warning',
        title: 'Tanggal Belum Lengkap',
        message: 'Pilih tanggal mulai dan selesai.',
      });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return showAlert({
        type: 'warning',
        title: 'Tanggal Tidak Valid',
        message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
      });
    }
    if (!reason.trim()) {
      return showAlert({
        type: 'warning',
        title: 'Keterangan Kosong',
        message: 'Isi alasan / keterangan pengajuan Anda.',
      });
    }

    const typeLabel = LEAVE_TYPES.find((t) => t.key === leaveType)?.label;
    const totalHari = hitungHari(startDate, endDate);
    const isEditing = editingId !== null;

    showAlert({
      type: 'confirm',
      title: isEditing ? 'Konfirmasi Perubahan' : 'Konfirmasi Pengajuan',
      message: `${typeLabel}\n${formatDisplayDate(
        startDate
      )} – ${formatDisplayDate(endDate)} (${totalHari} hari)\n\n${
        isEditing ? 'Ubah Data ?' : 'Lanjutkan kirim?'
      }`,
      confirmText: isEditing ? 'Simpan' : 'Kirim',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const payload = {
            type: leaveType,
            start_date: startDate,
            end_date: endDate,
            reason: reason.trim(),
          };

          let response;
          if (isEditing) {
            console.log('📤 PUT /my/leave-requests/' + editingId, payload);
            response = await leaveApi.update(editingId, payload);
          } else {
            console.log('📤 POST /my/leave-requests', payload);
            response = await leaveApi.create(payload);
          }

          console.log('✅ Success:', response.data);

          showAlert({
            type: 'success',
            title: isEditing ? 'Perubahan Tersimpan!' : 'Pengajuan Terkirim!',
            message: isEditing
              ? 'Pengajuan Anda berhasil diperbarui.'
              : `Pengajuan ${typeLabel} Anda sedang menunggu persetujuan atasan.`,
            confirmText: 'Selesai',
            onConfirm: () => {
              resetForm();
              loadHistory();
            },
          });
        } catch (e) {
          const status = e.response?.status;
          const data = e.response?.data;
          const errors = data?.errors;

          console.log('❌ Error status:', status);
          console.log('❌ Error data:', data);

          let msg = data?.message || e.message || 'Terjadi kesalahan';
          if (errors) {
            msg = Object.values(errors).flat().join('\n');
          }

          showAlert({
            type: 'error',
            title: status === 422 ? 'Validasi Gagal' : 'Gagal Kirim',
            message: msg,
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const totalHari = hitungHari(startDate, endDate);

  /* ===== RENDER ===== */
  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Pengajuan Cuti & Izin</Text>
            <Text style={styles.subtitle}>
              Ajukan cuti, izin, atau sakit dari sini
            </Text>
          </View>

          {/* Banner Mode Edit */}
          {editingId && (
            <View style={styles.editBanner}>
              <MaterialCommunityIcons name="pencil-circle" size={22} color="#2563eb" />
              <View style={{ flex: 1 }}>
                <Text style={styles.editBannerTitle}>Mode Edit</Text>
                <Text style={styles.editBannerSub}>
                  Ubah data di bawah lalu tap Simpan
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={styles.editBannerClose}
              >
                <MaterialCommunityIcons name="close" size={16} color="#2563eb" />
              </TouchableOpacity>
            </View>
          )}

          {/* Jenis Pengajuan */}
          <Text style={styles.sectionTitle}>Jenis Pengajuan</Text>
          <View style={styles.typeRow}>
            {LEAVE_TYPES.map((t) => {
              const active = leaveType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeItem,
                    { backgroundColor: active ? t.bg : '#ffffff' },
                    active && { borderColor: t.color },
                  ]}
                  onPress={() => setLeaveType(t.key)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.typeIcon,
                      { backgroundColor: active ? t.color : t.bg },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={t.icon}
                      size={22}
                      color={active ? '#ffffff' : t.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.typeLabel,
                      active && { color: t.color, fontWeight: '800' },
                    ]}
                  >
                    {t.label}
                  </Text>
                  {active && (
                    <View style={[styles.typeCheck, { backgroundColor: t.color }]}>
                      <MaterialCommunityIcons
                        name="check"
                        size={11}
                        color="#ffffff"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <DateInput
              label="Tanggal Mulai"
              value={startDate}
              onChange={setStartDate}
              icon="calendar-start"
            />

            <View style={{ height: 12 }} />

            <DateInput
              label="Tanggal Selesai"
              value={endDate}
              onChange={setEndDate}
              icon="calendar-end"
            />

            {totalHari > 0 && (
              <View style={styles.totalBox}>
                <MaterialCommunityIcons
                  name="information"
                  size={16}
                  color="#2563eb"
                />
                <Text style={styles.totalText}>
                  Total:{' '}
                  <Text style={{ fontWeight: '800' }}>{totalHari} hari</Text>
                </Text>
              </View>
            )}

            <View style={{ height: 12 }} />

            <Text style={styles.inputLabel}>Alasan / Keterangan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Jelaskan alasan pengajuan Anda..."
              placeholderTextColor="#94a3b8"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{reason.length}/1000</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              editingId && styles.submitBtnEdit,
              submitting && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={editingId ? 'content-save' : 'send'}
                  size={20}
                  color="#ffffff"
                />
                <Text style={styles.submitText}>
                  {editingId ? 'Ubah Data' : 'Kirim Pengajuan'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity
              style={styles.cancelEditBtn}
              onPress={handleCancelEdit}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={18} color="#64748b" />
              <Text style={styles.cancelEditText}>Batal Ubah</Text>
            </TouchableOpacity>
          )}

          {/* Riwayat */}
          <Text style={styles.sectionTitle}>Riwayat Pengajuan</Text>

          {loadingHistory ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color="#2563eb" />
              <Text style={styles.emptyText}>Memuat riwayat...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={48}
                color="#cbd5e1"
              />
              <Text style={styles.emptyText}>
                Belum ada pengajuan.{'\n'}Ajukan pertama Anda di atas.
              </Text>
            </View>
          ) : (
            history.map((h) => {
              const t = LEAVE_TYPES.find((lt) => lt.key === h.type);
              const st = STATUS_CONFIG[h.status] || STATUS_CONFIG.pending;
              const days = hitungHari(h.start_date, h.end_date);
              const isPending = h.status === 'pending';
              const isEditingItem = editingId === h.id;

              return (
                <View
                  key={h.id}
                  style={[
                    styles.historyCard,
                    isEditingItem && styles.historyCardActive,
                  ]}
                >
                  <View
                    style={[
                      styles.historyIcon,
                      { backgroundColor: t?.bg || '#f1f5f9' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={t?.icon || 'calendar'}
                      size={20}
                      color={t?.color || '#475569'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.historyTop}>
                      <Text style={styles.historyType}>
                        {t?.label || h.type}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                        <MaterialCommunityIcons
                          name={st.icon}
                          size={11}
                          color={st.color}
                        />
                        <Text style={[styles.statusText, { color: st.color }]}>
                          {st.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.historyDate}>
                      {formatDisplayDate(h.start_date)} –{' '}
                      {formatDisplayDate(h.end_date)} · {days} hari
                    </Text>

                    {h.reason ? (
                      <Text style={styles.historyReason} numberOfLines={2}>
                        {h.reason}
                      </Text>
                    ) : null}

                    {/* Action Buttons — hanya pending */}
                    {isPending && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.editBtn]}
                          onPress={() => handleEdit(h)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons
                            name="pencil"
                            size={13}
                            color="#2563eb"
                          />
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => handleDelete(h)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons
                            name="trash-can"
                            size={13}
                            color="#dc2626"
                          />
                          <Text style={styles.deleteBtnText}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 40 }} />
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

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },

  header: { marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },

  /* Banner Mode Edit */
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editBannerTitle: { fontSize: 13, fontWeight: '800', color: '#2563eb' },
  editBannerSub: { fontSize: 11, color: '#3b82f6', marginTop: 1 },
  editBannerClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Type Row */
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typeItem: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  typeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Form */
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputText: { flex: 1, fontSize: 13, color: '#0f172a', fontWeight: '600' },
  textArea: {
    minHeight: 90,
    paddingTop: 12,
    alignItems: 'flex-start',
    color: '#0f172a',
    fontSize: 13,
  },
  charCount: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },

  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  totalText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },

  /* Submit */
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  submitBtnEdit: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  submitText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

  cancelEditBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelEditText: { fontSize: 13, color: '#64748b', fontWeight: '700' },

  /* History */
  historyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  historyCardActive: {
    borderColor: '#2563eb',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  historyType: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  historyDate: { fontSize: 11, color: '#64748b' },
  historyReason: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    fontStyle: 'italic',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  statusText: { fontSize: 9, fontWeight: '700' },

  /* Action Buttons (Edit/Hapus) */
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe',
  },
  editBtnText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  deleteBtnText: { fontSize: 11, fontWeight: '700', color: '#dc2626' },

  /* Empty */
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Date Picker Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateOptionActive: { backgroundColor: '#2563eb' },
  dateOptionText: { fontSize: 13, color: '#334155', fontWeight: '600' },
});
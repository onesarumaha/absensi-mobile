import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../components/AnimatedBackground';
import MiniMap from '../components/MiniMap';
import { attendanceApi } from '../services/api';

/* Config status */
const STATUS_CONFIG = {
  hadir: { bg: '#dcfce7', color: '#16a34a', label: 'Hadir', icon: 'check-circle' },
  terlambat: { bg: '#fef3c7', color: '#d97706', label: 'Terlambat', icon: 'clock-alert' },
  izin: { bg: '#dbeafe', color: '#2563eb', label: 'Izin', icon: 'file-document' },
  sakit: { bg: '#fee2e2', color: '#dc2626', label: 'Sakit', icon: 'medical-bag' },
  cuti: { bg: '#ede9fe', color: '#7c3aed', label: 'Cuti', icon: 'calendar-star' },
  libur: { bg: '#f1f5f9', color: '#64748b', label: 'Libur', icon: 'calendar-remove' },
  alpha: { bg: '#fee2e2', color: '#dc2626', label: 'Alpha', icon: 'close-circle' },
};

/* Helper: format tanggal dari "2026-09-19" → "19 Sep 2026" */
const formatDisplayDate = (dateStr) => {
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
};

/* Helper: format hari dari "2026-09-19" → "Jumat" */
const formatDay = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'long' });
  } catch {
    return '-';
  }
};

/* Helper: hitung durasi kerja dalam format "8j 40m" */
const hitungDurasi = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '-';
  try {
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const totalIn = inH * 60 + inM;
    const totalOut = outH * 60 + outM;
    const diff = totalOut - totalIn;
    if (diff <= 0) return '-';
    const jam = Math.floor(diff / 60);
    const menit = diff % 60;
    return `${jam}j ${menit}m`;
  } catch {
    return '-';
  }
};

export default function AttendanceHistoryScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('semua');
  const [selectedItem, setSelectedItem] = useState(null);

  /* ===== Load data dari backend ===== */
  const loadHistory = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await attendanceApi.history();
      const list = response.data?.data ?? response.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch (e) {
      console.log('❌ Load history error:', e.response?.data || e.message);
    } finally {
      setLoading(false);
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

  /* ===== Statistik ===== */
  const stats = {
    hadir: data.filter((d) => d.status === 'hadir').length,
    terlambat: data.filter((d) => d.status === 'terlambat').length,
    izin: data.filter((d) => ['izin', 'sakit', 'cuti'].includes(d.status)).length,
    alpha: data.filter((d) => d.status === 'alpha').length,
  };

  const totalHariKerja = data.length || 1;
  const persenKehadiran = Math.round(
    ((stats.hadir + stats.terlambat) / totalHariKerja) * 100
  );

  const filters = [
    { key: 'semua', label: 'Semua' },
    { key: 'hadir', label: 'Hadir' },
    { key: 'terlambat', label: 'Terlambat' },
  ];

  const filteredData =
    activeFilter === 'semua'
      ? data
      : data.filter((d) => d.status === activeFilter);

  /* Format range tanggal */
  const headerRange =
    data.length > 0
      ? `${formatDisplayDate(data[data.length - 1]?.date)} – ${formatDisplayDate(data[0]?.date)}`
      : 'Belum ada data absensi';

  /* ===== Render ===== */
  return (
    <View style={styles.root}>
      <AnimatedBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
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
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Riwayat Absensi</Text>
              <Text style={styles.subtitle}>{headerRange}</Text>
            </View>
            <View style={styles.monthPicker}>
              <MaterialCommunityIcons
                name="calendar-month"
                size={16}
                color="#2563eb"
              />
              <Text style={styles.monthPickerText}>Bulan Ini</Text>
            </View>
          </View>

          {/* STATISTIK */}
          <View style={styles.statsCard}>
            {[
              { icon: 'check-circle', color: '#16a34a', bg: '#dcfce7', value: stats.hadir, label: 'Hadir' },
              { icon: 'clock-alert', color: '#d97706', bg: '#fef3c7', value: stats.terlambat, label: 'Telat' },
              { icon: 'file-document', color: '#2563eb', bg: '#dbeafe', value: stats.izin, label: 'Izin' },
              { icon: 'close-circle', color: '#dc2626', bg: '#fee2e2', value: stats.alpha, label: 'Alpha' },
            ].map((s, i, arr) => (
              <View
                key={s.label}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={styles.statBox}>
                  <View style={[styles.statIconBg, { backgroundColor: s.bg }]}>
                    <MaterialCommunityIcons
                      name={s.icon}
                      size={20}
                      color={s.color}
                    />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDivider} />}
              </View>
            ))}
          </View>

          {/* PROGRESS */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Kehadiran Bulan Ini</Text>
              <Text style={styles.progressPercent}>{persenKehadiran}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${persenKehadiran}%` }]}
              />
            </View>
            <Text style={styles.progressSub}>
              {stats.hadir + stats.terlambat} dari {data.length} hari tercatat
            </Text>
          </View>

          {/* FILTER */}
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  activeFilter === f.key && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === f.key && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* LIST */}
          <Text style={styles.sectionTitle}>
            Detail Absensi ({filteredData.length})
          </Text>

          {loading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color="#2563eb" />
              <Text style={styles.emptyText}>Memuat data...</Text>
            </View>
          ) : filteredData.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={48}
                color="#cbd5e1"
              />
              <Text style={styles.emptyText}>
                Belum ada data absensi.{'\n'}Silakan absen di halaman Absen.
              </Text>
            </View>
          ) : (
            filteredData.map((item) => {
              const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.hadir;
              const dateObj = new Date(item.date);
              const dayNum = dateObj.getDate() || '-';
              const monthShort = dateObj
                .toLocaleDateString('id-ID', { month: 'short' })
                .replace('.', '');
              const dayName = formatDay(item.date);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => setSelectedItem(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateText}>{dayNum}</Text>
                      <Text style={styles.monthText}>{monthShort}</Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.dayText}>{dayName}</Text>
                      <View style={styles.timeRow}>
                        <View style={styles.timeItem}>
                          <MaterialCommunityIcons
                            name="login"
                            size={12}
                            color="#16a34a"
                          />
                          <Text style={styles.timeText}>
                            {item.check_in?.substring(0, 5) || '-'}
                          </Text>
                        </View>
                        <View style={styles.timeItem}>
                          <MaterialCommunityIcons
                            name="logout"
                            size={12}
                            color="#db2777"
                          />
                          <Text style={styles.timeText}>
                            {item.check_out?.substring(0, 5) || '-'}
                          </Text>
                        </View>
                        {item.check_in && item.check_out && (
                          <Text style={styles.durationText}>
                            · {hitungDurasi(item.check_in, item.check_out)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <MaterialCommunityIcons
                      name={st.icon}
                      size={12}
                      color={st.color}
                    />
                    <Text style={[styles.statusText, { color: st.color }]}>
                      {st.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ===== MODAL DETAIL ===== */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Detail Absensi</Text>
                <Text style={styles.modalSubtitle}>
                  {formatDay(selectedItem?.date)},{' '}
                  {formatDisplayDate(selectedItem?.date)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedItem(null)}
              >
                <MaterialCommunityIcons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* FOTO CHECK-IN */}
              {selectedItem?.check_in_photo ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="login"
                      size={16}
                      color="#16a34a"
                    />
                    <Text style={styles.sectionTitleSmall}>
                      Foto Wajah Saat Masuk
                    </Text>
                  </View>
                  <View style={styles.photoWrapper}>
                    <Image
                      source={{ uri: selectedItem.check_in_photo }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                    <View style={styles.photoBadge}>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={14}
                        color="#ffffff"
                      />
                      <Text style={styles.photoBadgeText}>Terverifikasi</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noPhotoBox}>
                  <MaterialCommunityIcons
                    name="face-recognition"
                    size={40}
                    color="#cbd5e1"
                  />
                  <Text style={styles.noPhotoText}>
                    Tidak ada foto check-in
                  </Text>
                </View>
              )}

              {/* FOTO CHECK-OUT */}
              {selectedItem?.check_out_photo ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="logout"
                      size={16}
                      color="#db2777"
                    />
                    <Text style={styles.sectionTitleSmall}>
                      Foto Wajah Saat Pulang
                    </Text>
                  </View>
                  <View style={styles.photoWrapper}>
                    <Image
                      source={{ uri: selectedItem.check_out_photo }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                    <View style={[styles.photoBadge, { backgroundColor: '#db2777' }]}>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={14}
                        color="#ffffff"
                      />
                      <Text style={styles.photoBadgeText}>Terverifikasi</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* MAPS — check-in */}
              {selectedItem?.check_in_latitude && selectedItem?.check_in_longitude ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="map-marker-radius"
                      size={16}
                      color="#16a34a"
                    />
                    <Text style={styles.sectionTitleSmall}>
                      Lokasi Check-In
                    </Text>
                  </View>

                  <View style={styles.mapWrapper}>
                    <MiniMap
                      latitude={Number(selectedItem.check_in_latitude)}
                      longitude={Number(selectedItem.check_in_longitude)}
                      title="Lokasi Masuk"
                      height={200}
                    />
                  </View>

                  <View style={styles.locationInfo}>
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={16}
                      color="#16a34a"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locationName}>Koordinat Masuk</Text>
                      <Text style={styles.locationAddress}>
                        {Number(selectedItem.check_in_latitude).toFixed(6)},{' '}
                        {Number(selectedItem.check_in_longitude).toFixed(6)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* MAPS — check-out */}
              {selectedItem?.check_out_latitude && selectedItem?.check_out_longitude ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="map-marker-radius"
                      size={16}
                      color="#db2777"
                    />
                    <Text style={styles.sectionTitleSmall}>
                      Lokasi Check-Out
                    </Text>
                  </View>

                  <View style={styles.mapWrapper}>
                    <MiniMap
                      latitude={Number(selectedItem.check_out_latitude)}
                      longitude={Number(selectedItem.check_out_longitude)}
                      title="Lokasi Pulang"
                      height={200}
                    />
                  </View>

                  <View style={styles.locationInfo}>
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={16}
                      color="#db2777"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locationName}>Koordinat Pulang</Text>
                      <Text style={styles.locationAddress}>
                        {Number(selectedItem.check_out_latitude).toFixed(6)},{' '}
                        {Number(selectedItem.check_out_longitude).toFixed(6)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* JAM MASUK / PULANG */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color="#2563eb"
                  />
                  <Text style={styles.sectionTitleSmall}>Waktu Absensi</Text>
                </View>

                <View style={styles.timeGrid}>
                  <View style={[styles.timeBox, { backgroundColor: '#dcfce7' }]}>
                    <MaterialCommunityIcons
                      name="login"
                      size={18}
                      color="#16a34a"
                    />
                    <Text style={styles.timeBoxLabel}>Masuk</Text>
                    <Text style={[styles.timeBoxValue, { color: '#16a34a' }]}>
                      {selectedItem?.check_in?.substring(0, 5) || '-'}
                    </Text>
                  </View>

                  <View style={[styles.timeBox, { backgroundColor: '#fce7f3' }]}>
                    <MaterialCommunityIcons
                      name="logout"
                      size={18}
                      color="#db2777"
                    />
                    <Text style={styles.timeBoxLabel}>Pulang</Text>
                    <Text style={[styles.timeBoxValue, { color: '#db2777' }]}>
                      {selectedItem?.check_out?.substring(0, 5) || '-'}
                    </Text>
                  </View>

                  <View style={[styles.timeBox, { backgroundColor: '#dbeafe' }]}>
                    <MaterialCommunityIcons
                      name="timer-outline"
                      size={18}
                      color="#2563eb"
                    />
                    <Text style={styles.timeBoxLabel}>Durasi</Text>
                    <Text style={[styles.timeBoxValue, { color: '#2563eb' }]}>
                      {hitungDurasi(selectedItem?.check_in, selectedItem?.check_out)}
                    </Text>
                  </View>
                </View>

                {/* Info telat */}
                {selectedItem?.late_minutes > 0 && (
                  <View style={styles.lateBox}>
                    <MaterialCommunityIcons
                      name="clock-alert"
                      size={16}
                      color="#d97706"
                    />
                    <Text style={styles.lateText}>
                      Terlambat {selectedItem.late_minutes} menit
                    </Text>
                  </View>
                )}
              </View>

              {/* CATATAN */}
              {selectedItem?.notes ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="note-text-outline"
                      size={16}
                      color="#475569"
                    />
                    <Text style={styles.sectionTitleSmall}>Catatan</Text>
                  </View>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{selectedItem.notes}</Text>
                  </View>
                </View>
              ) : null}

              {/* STATUS */}
              {selectedItem && (
                <View style={styles.section}>
                  <View
                    style={[
                      styles.statusBigBox,
                      {
                        backgroundColor:
                          STATUS_CONFIG[selectedItem.status]?.bg || '#dcfce7',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        STATUS_CONFIG[selectedItem.status]?.icon ||
                        'check-circle'
                      }
                      size={22}
                      color={
                        STATUS_CONFIG[selectedItem.status]?.color || '#16a34a'
                      }
                    />
                    <Text
                      style={[
                        styles.statusBigText,
                        {
                          color:
                            STATUS_CONFIG[selectedItem.status]?.color ||
                            '#16a34a',
                        },
                      ]}
                    >
                      Status:{' '}
                      {STATUS_CONFIG[selectedItem.status]?.label || 'Hadir'}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthPickerText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },

  /* Stats */
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 50, backgroundColor: '#f1f5f9' },

  /* Progress */
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  progressPercent: { fontSize: 16, fontWeight: '800', color: '#22c55e' },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 4 },
  progressSub: { fontSize: 11, color: '#64748b' },

  /* Filter */
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterTextActive: { color: '#ffffff' },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dateCol: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateText: { fontSize: 16, fontWeight: '800', color: '#2563eb' },
  monthText: { fontSize: 9, color: '#2563eb', fontWeight: '600' },
  cardInfo: { flex: 1 },
  dayText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 8,
    flexWrap: 'wrap',
  },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  durationText: { fontSize: 10, color: '#94a3b8' },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '700' },

  /* Empty */
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* MODAL */
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
    maxHeight: '92%',
    minHeight: '70%',
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
  modalSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitleSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },

  photoWrapper: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  photoBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  photoBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },

  noPhotoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 20,
  },
  noPhotoText: { fontSize: 12, color: '#94a3b8', marginTop: 8 },

  mapWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
  },

  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  locationName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  locationAddress: { fontSize: 11, color: '#64748b', marginTop: 2 },

  timeGrid: { flexDirection: 'row', gap: 8 },
  timeBox: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
  timeBoxLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  timeBoxValue: { fontSize: 14, fontWeight: '800' },

  lateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
  },
  lateText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '700',
  },

  notesBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  notesText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  statusBigBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  statusBigText: { fontSize: 14, fontWeight: '800' },
});
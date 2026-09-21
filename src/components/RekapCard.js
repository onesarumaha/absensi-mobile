import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function RekapCard({ data, loading = false }) {
  if (loading || !data) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Rekap Absen Bulan Ini</Text>
        <View style={styles.row}>
          <SkeletonBox color="#dcfce7" />
          <SkeletonBox color="#dbeafe" />
          <SkeletonBox color="#ffedd5" />
        </View>
      </View>
    );
  }

  const items = [
    { key: 'hadir', label: 'Hadir', value: data.hadir ?? 0, suffix: 'Hari', bg: '#dcfce7', color: '#16a34a', icon: 'check-circle' },
    { key: 'izin', label: 'Izin', value: (data.izin ?? 0) + (data.sakit ?? 0), suffix: 'Hari', bg: '#dbeafe', color: '#2563eb', icon: 'file-document' },
    { key: 'cuti', label: 'Sisa Cuti', value: data.sisa_cuti ?? 0, suffix: 'Hari', bg: '#ffedd5', color: '#ea580c', icon: 'calendar-star' },
  ];

  const totalHariKerja = data.total_hari_kerja ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Rekap Absen Bulan Ini</Text>
        {totalHariKerja > 0 && (
          <Text style={styles.totalBadge}>{totalHariKerja} hari</Text>
        )}
      </View>

      <View style={styles.row}>
        {items.map((item) => (
          <View
            key={item.key}
            style={[styles.box, { backgroundColor: item.bg }]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={14}
              color={item.color}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.label, { color: item.color }]}>{item.label}</Text>
            <Text style={[styles.value, { color: item.color }]}>
              {item.value} <Text style={styles.suffix}>{item.suffix}</Text>
            </Text>
          </View>
        ))}
      </View>

      {(data.terlambat > 0 || data.cuti_terpakai > 0) && (
        <View style={styles.infoRow}>
          {data.terlambat > 0 && (
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-alert" size={12} color="#d97706" />
              <Text style={styles.infoText}>Terlambat: {data.terlambat}x</Text>
            </View>
          )}
          {data.cuti_terpakai > 0 && (
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar-minus" size={12} color="#7c3aed" />
              <Text style={styles.infoText}>
                Cuti terpakai: {data.cuti_terpakai}/{data.cuti_tahunan}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function SkeletonBox({ color }) {
  return (
    <View style={[styles.box, { backgroundColor: color, opacity: 0.4 }]}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '70%' }]} />
      <View style={[styles.skeletonLine, { width: '50%' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  totalBadge: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  label: { fontSize: 10, fontWeight: '700' },
  value: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  suffix: { fontSize: 9, fontWeight: '600', opacity: 0.7 },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  skeletonLine: {
    width: '90%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginBottom: 4,
  },
});
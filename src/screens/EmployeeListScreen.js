import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedBackground from '../components/AnimatedBackground';
import CustomAlert from '../components/CustomAlert';
import API from '../services/api';

export default function EmployeeListScreen({ navigation }) {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (config) =>
    setAlertConfig((prev) => ({ ...prev, ...config, visible: true }));
  const hideAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(fabAnim, {
        toValue: 1,
        delay: 400,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ===== Normalize dari EmployeeResource ===== */
  const normalize = (emp) => {
    return {
      id: emp?.id,
      employee_number: emp?.employee_number || null,
      full_name: emp?.full_name || 'Tanpa Nama',
      phone: emp?.phone || null,
      address: emp?.address || null,
      join_date: emp?.join_date || null,
      status: emp?.status || null,

      // Relasi
      user: emp?.user || null,
      department: emp?.department || null,
      position: emp?.position || null,
      work_schedule: emp?.work_schedule || null,

      // Meta
      created_at: emp?.created_at || null,
      updated_at: emp?.updated_at || null,
    };
  };

  /* ===== Fetch employees (dengan pagination) ===== */
  const fetchEmployees = async ({ page = 1, isRefresh = false, append = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await API.get('/employees', { params: { page } });

      // EmployeeResource::collection → Laravel paginator:
      // { data: [...], current_page, last_page, total, per_page, ... }
      const payload = res.data;
      const items = payload?.data || [];
      const meta = {
        current_page: payload?.current_page || payload?.meta?.current_page || 1,
        last_page: payload?.last_page || payload?.meta?.last_page || 1,
        total: payload?.total || payload?.meta?.total || items.length,
      };

      const normalized = items.map(normalize);

      if (append) {
        setEmployees((prev) => [...prev, ...normalized]);
      } else {
        setEmployees(normalized);
        setFiltered(normalized);
      }

      setCurrentPage(meta.current_page);
      setLastPage(meta.last_page);
      setTotal(meta.total);
    } catch (error) {
      console.log(
        '❌ Fetch employees error:',
        error.response?.data || error.message
      );
      showAlert({
        type: 'error',
        title: 'Gagal Memuat',
        message:
          error.response?.data?.message ||
          'Tidak dapat memuat data pegawai. Silakan coba lagi.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEmployees({ page: 1 });
  }, []);

  // Auto-refresh saat kembali dari form
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEmployees({ page: 1, isRefresh: true });
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setSearch('');
    fetchEmployees({ page: 1, isRefresh: true });
  };

  const onEndReached = () => {
    if (loadingMore || loading) return;
    if (currentPage >= lastPage) return;
    fetchEmployees({ page: currentPage + 1, append: true });
  };

  /* ===== Search filter ===== */
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(employees);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      employees.filter((emp) => {
        return (
          (emp.full_name || '').toLowerCase().includes(q) ||
          (emp.user?.email || '').toLowerCase().includes(q) ||
          (emp.employee_number || '').toLowerCase().includes(q) ||
          (emp.position?.name || '').toLowerCase().includes(q) ||
          (emp.department?.name || '').toLowerCase().includes(q)
        );
      })
    );
  }, [search, employees]);

  /* ===== Format helpers ===== */
  const formatDate = (iso) => {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  };

  const getStatusColor = (status) => {
    if (status === 'active') return { bg: '#dcfce7', text: '#16a34a' };
    return { bg: '#fee2e2', text: '#dc2626' };
  };

  /* ===== Handle tambah ===== */
  const handleAddEmployee = () => {
    navigation?.navigate('EmployeeForm');
  };

  /* ===== Render item ===== */
  const renderItem = ({ item: emp }) => {
    const statusStyle = getStatusColor(emp.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() =>
          showAlert({
            type: 'info',
            title: emp.full_name,
            message: [
              `NIP: ${emp.employee_number || '-'}`,
              `Email: ${emp.user?.email || '-'}`,
              `Jabatan: ${emp.position?.name || '-'}`,
              `Departemen: ${emp.department?.name || '-'}`,
              `Jadwal: ${emp.work_schedule?.name || '-'}`,
              `Masuk: ${formatDate(emp.join_date)}`,
            ].join('\n'),
          })
        }
      >
        {/* Avatar */}
        <View style={styles.photoWrap}>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoInitial}>
              {(emp.full_name || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          {emp.status === 'active' && <View style={styles.onlineDot} />}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {emp.full_name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusStyle.bg },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: statusStyle.text },
                ]}
              >
                {emp.status === 'active' ? 'Aktif' : 'Non-Aktif'}
              </Text>
            </View>
          </View>

          {emp.employee_number ? (
            <View style={styles.row}>
              <MaterialCommunityIcons
                name="identifier"
                size={11}
                color="#94a3b8"
              />
              <Text style={styles.sub} numberOfLines={1}>
                {emp.employee_number}
              </Text>
            </View>
          ) : null}

          {emp.position?.name ? (
            <View style={styles.row}>
              <MaterialCommunityIcons
                name="badge-account-outline"
                size={12}
                color="#2563eb"
              />
              <Text style={styles.position} numberOfLines={1}>
                {emp.position.name}
                {emp.department?.name ? ` · ${emp.department.name}` : ''}
              </Text>
            </View>
          ) : null}

          {emp.user?.email ? (
            <View style={styles.row}>
              <MaterialCommunityIcons
                name="email-outline"
                size={11}
                color="#94a3b8"
              />
              <Text style={styles.sub} numberOfLines={1}>
                {emp.user.email}
              </Text>
            </View>
          ) : null}
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color="#cbd5e1"
        />
      </TouchableOpacity>
    );
  };

  /* ===== Render footer (loading more) ===== */
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.footerLoaderText}>Memuat lebih banyak...</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedBackground />
      </View>

      <SafeAreaView style={styles.container} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#ffffff"
            />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Data Pegawai</Text>
            <Text style={styles.headerSubtitle}>
              Total: {total} pegawai
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#94a3b8"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, email, NIP, jabatan..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color="#94a3b8"
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* CONTENT */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Memuat data pegawai...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={56}
              color="#cbd5e1"
            />
            <Text style={styles.emptyText}>
              {search
                ? 'Tidak ada pegawai yang cocok'
                : 'Belum ada data pegawai'}
            </Text>
          </View>
        ) : (
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <FlatList
              data={filtered}
              keyExtractor={(item, idx) => String(item.id || idx)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onEndReached={search ? null : onEndReached}
              onEndReachedThreshold={0.4}
              ListFooterComponent={renderFooter}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#2563eb']}
                  tintColor="#2563eb"
                />
              }
            />
          </Animated.View>
        )}

        {/* FAB TAMBAH */}
        <Animated.View
          style={[
            styles.fabWrap,
            {
              opacity: fabAnim,
              transform: [
                {
                  scale: fabAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddEmployee}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="plus"
              size={26}
              color="#ffffff"
            />
            <Text style={styles.fabText}>Tambah</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText="OK"
        onClose={hideAlert}
      />
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f9ff' },
  container: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    paddingVertical: 0,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 100,
    gap: 10,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  photoWrap: { position: 'relative' },
  photoPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  photoInitial: { color: '#2563eb', fontSize: 20, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },

  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  position: { fontSize: 11, color: '#2563eb', fontWeight: '700', flex: 1 },
  sub: { fontSize: 11, color: '#64748b', fontWeight: '500', flex: 1 },

  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  footerLoaderText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },

  /* FAB */
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    zIndex: 99,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#2563eb',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
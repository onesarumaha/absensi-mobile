import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, {
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
import API from '../services/api';

const INITIAL_FORM = {
  full_name: '',
  email: '',
  password: '',
  employee_number: '',
  phone: '',
  address: '',
  department_id: null,
  position_id: null,
  work_schedule_id: null,
  join_date: '',
  status: 'active',
};

export default function EmployeeFormScreen({ navigation, route }) {
  const employeeId = route?.params?.id || null;
  const isEdit = !!employeeId;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Master data
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Picker modal (untuk dropdown select)
  const [picker, setPicker] = useState({
    visible: false,
    key: null,
    title: '',
    options: [],
  });

  // Date picker (khusus iOS)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    showCancel: false,
    onConfirm: null,
  });

  const showAlert = (config) =>
    setAlertConfig((prev) => ({ ...prev, ...config, visible: true }));
  const hideAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ===== Ambil master data ===== */
  useEffect(() => {
    const fetchMaster = async () => {
      setLoadingMaster(true);
      try {
        const [depRes, posRes, wsRes] = await Promise.allSettled([
          API.get('/departments'),
          API.get('/positions'),
          API.get('/work-schedules'),
        ]);

        const extract = (res) => {
          if (res.status !== 'fulfilled') return [];
          const d = res.value.data;
          return d?.data || d?.items || (Array.isArray(d) ? d : []);
        };

        setDepartments(extract(depRes));
        setPositions(extract(posRes));
        setWorkSchedules(extract(wsRes));
      } catch (err) {
        console.log('❌ Fetch master error:', err.message);
      } finally {
        setLoadingMaster(false);
      }
    };
    fetchMaster();
  }, []);

  /* ===== Load detail kalau mode edit ===== */
  useEffect(() => {
    if (!isEdit) return;
    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await API.get(`/employees/${employeeId}`);
        const data = res.data?.data || res.data || {};
        const e = data?.employee || data;

        setForm({
          full_name: e?.full_name || e?.user?.name || '',
          email: e?.user?.email || e?.email || '',
          password: '',
          employee_number: e?.employee_number || '',
          phone: e?.phone || '',
          address: e?.address || '',
          department_id: e?.department_id || e?.department?.id || null,
          position_id: e?.position_id || e?.position?.id || null,
          work_schedule_id:
            e?.work_schedule_id || e?.work_schedule?.id || null,
          join_date: e?.join_date
            ? String(e.join_date).substring(0, 10)
            : '',
          status: e?.status || 'active',
        });
      } catch (err) {
        console.log('❌ Fetch detail error:', err.response?.data || err.message);
        showAlert({
          type: 'error',
          title: 'Gagal Memuat',
          message: 'Tidak dapat memuat detail pegawai.',
        });
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [employeeId]);

  /* ===== Helpers ===== */
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const findName = (list, id) =>
    list.find((item) => item.id === id)?.name ||
    list.find((item) => item.id === id)?.title ||
    null;

  const openPicker = (key, title, options) => {
    setPicker({ visible: true, key, title, options });
  };

  const closePicker = () =>
    setPicker({ visible: false, key: null, title: '', options: [] });

  const selectOption = (item) => {
    setField(picker.key, item.id);
    closePicker();
  };

  /* ===== Date helpers ===== */
  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    if (!y || !m || !d) return isoDate;
    return `${d}/${m}/${y}`;
  };

  const dateToIso = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  /* ===== Buka date picker ===== */
  const openDatePicker = () => {
    const initial = form.join_date
      ? new Date(form.join_date + 'T00:00:00')
      : new Date();

    if (Platform.OS === 'android') {
      // ✅ Android: pakai imperative API (tidak deprecated)
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        display: 'default',
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            setField('join_date', dateToIso(selectedDate));
          }
        },
      });
    } else {
      // iOS: state + Modal + spinner
      setTempDate(initial);
      setShowDatePicker(true);
    }
  };

  /* ===== Handler iOS (spinner inline pakai onValueChange) ===== */
  const onIosDateValueChange = (selectedDate) => {
    if (selectedDate) setTempDate(selectedDate);
  };

  const confirmIosDate = () => {
    setField('join_date', dateToIso(tempDate));
    setShowDatePicker(false);
  };

  const cancelIosDate = () => {
    setShowDatePicker(false);
  };

  /* ===== Validasi client ===== */
  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Nama lengkap wajib diisi.';
    if (!form.email.trim()) e.email = 'Email wajib diisi.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      e.email = 'Format email tidak valid.';
    if (!isEdit && !form.password) e.password = 'Password wajib diisi.';
    else if (form.password && form.password.length < 6)
      e.password = 'Password minimal 6 karakter.';
    if (!form.employee_number.trim())
      e.employee_number = 'Nomor pegawai wajib diisi.';
    if (!form.department_id) e.department_id = 'Pilih departemen.';
    if (!form.position_id) e.position_id = 'Pilih jabatan.';
    if (!form.work_schedule_id)
      e.work_schedule_id = 'Pilih jadwal kerja.';
    if (!form.join_date) e.join_date = 'Tanggal masuk wajib diisi.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ===== Submit ===== */
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        employee_number: form.employee_number.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        department_id: form.department_id,
        position_id: form.position_id,
        work_schedule_id: form.work_schedule_id,
        join_date: form.join_date,
        status: form.status,
      };
      if (form.password) payload.password = form.password;

      if (isEdit) {
        await API.put(`/employees/${employeeId}`, payload);
      } else {
        await API.post('/employees', payload);
      }

      showAlert({
        type: 'success',
        title: isEdit ? 'Berhasil Diperbarui' : 'Berhasil Ditambahkan',
        message: isEdit
          ? 'Data pegawai berhasil diperbarui.'
          : 'Pegawai baru berhasil ditambahkan.',
        confirmText: 'OK',
        onConfirm: () => {
          hideAlert();
          navigation.goBack();
        },
      });
    } catch (error) {
      console.log('❌ Submit error:', error.response?.data || error.message);
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 422 && data?.errors) {
        setErrors(data.errors);
        showAlert({
          type: 'error',
          title: 'Validasi Gagal',
          message: data?.message || 'Periksa kembali data yang Anda isi.',
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Gagal Menyimpan',
          message:
            data?.message ||
            error.message ||
            'Terjadi kesalahan. Silakan coba lagi.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    navigation.goBack();
  };

  /* ===== Render input helper ===== */
  const renderInput = ({
    label,
    key,
    placeholder,
    icon = 'pencil-outline',
    keyboardType = 'default',
    secureTextEntry = false,
    autoCapitalize = 'sentences',
    required = false,
    multiline = false,
  }) => {
    const hasError = !!errors[key];
    return (
      <View style={styles.field}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <View
          style={[
            styles.inputWrap,
            hasError && styles.inputError,
            multiline && { height: 88, paddingVertical: 10 },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={hasError ? '#ef4444' : '#94a3b8'}
            style={multiline && { marginTop: 2 }}
          />
          <TextInput
            style={[styles.input, multiline && { textAlignVertical: 'top' }]}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            value={form[key]}
            onChangeText={(t) => setField(key, t)}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            editable={!submitting}
            multiline={multiline}
          />
        </View>
        {errors[key] ? (
          <Text style={styles.errorText}>
            {Array.isArray(errors[key]) ? errors[key][0] : errors[key]}
          </Text>
        ) : null}
      </View>
    );
  };

  /* ===== Render picker button ===== */
  const renderPicker = ({
    label,
    key,
    placeholder,
    icon = 'chevron-down-circle-outline',
    options,
    required = false,
  }) => {
    const hasError = !!errors[key];
    const selectedName = findName(options, form[key]);
    return (
      <View style={styles.field}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TouchableOpacity
          style={[styles.inputWrap, hasError && styles.inputError]}
          onPress={() =>
            openPicker(
              key,
              label,
              options.map((o) => ({
                id: o.id,
                name: o.name || o.title || `#${o.id}`,
              }))
            )
          }
          disabled={submitting || loadingMaster}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={hasError ? '#ef4444' : '#94a3b8'}
          />
          <Text
            style={[styles.input, !selectedName && { color: '#94a3b8' }]}
            numberOfLines={1}
          >
            {selectedName || placeholder}
          </Text>
          {loadingMaster ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color="#94a3b8"
            />
          )}
        </TouchableOpacity>
        {errors[key] ? (
          <Text style={styles.errorText}>
            {Array.isArray(errors[key]) ? errors[key][0] : errors[key]}
          </Text>
        ) : null}
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
            onPress={handleCancel}
            disabled={submitting}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#ffffff"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Pegawai' : 'Tambah Pegawai'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {loadingDetail ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Memuat detail...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                {/* ===== DATA PRIBADI ===== */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Data Pribadi</Text>

                  {renderInput({
                    label: 'Nama Lengkap',
                    key: 'full_name',
                    placeholder: 'contoh: Budi Santoso',
                    icon: 'account-outline',
                    autoCapitalize: 'words',
                    required: true,
                  })}

                  {renderInput({
                    label: 'Email',
                    key: 'email',
                    placeholder: 'nama@email.com',
                    icon: 'email-outline',
                    keyboardType: 'email-address',
                    autoCapitalize: 'none',
                    required: true,
                  })}

                  {renderInput({
                    label: 'Nomor Pegawai',
                    key: 'employee_number',
                    placeholder: 'contoh: EMP-001',
                    icon: 'identifier',
                    autoCapitalize: 'characters',
                    required: true,
                  })}

                  {renderInput({
                    label: 'Nomor HP',
                    key: 'phone',
                    placeholder: 'contoh: 081234567890',
                    icon: 'phone-outline',
                    keyboardType: 'phone-pad',
                  })}

                  {renderInput({
                    label: 'Alamat',
                    key: 'address',
                    placeholder: 'Alamat lengkap...',
                    icon: 'map-marker-outline',
                    multiline: true,
                  })}
                </View>

                {/* ===== DATA KERJA ===== */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Data Kerja</Text>

                  {renderPicker({
                    label: 'Departemen',
                    key: 'department_id',
                    placeholder: 'Pilih departemen',
                    icon: 'office-building-outline',
                    options: departments,
                    required: true,
                  })}

                  {renderPicker({
                    label: 'Jabatan',
                    key: 'position_id',
                    placeholder: 'Pilih jabatan',
                    icon: 'badge-account-outline',
                    options: positions,
                    required: true,
                  })}

                  {renderPicker({
                    label: 'Jadwal Kerja',
                    key: 'work_schedule_id',
                    placeholder: 'Pilih jadwal kerja',
                    icon: 'calendar-clock-outline',
                    options: workSchedules,
                    required: true,
                  })}

                  {/* ===== Tanggal Masuk dengan Date Picker ===== */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Tanggal Masuk <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputWrap,
                        errors.join_date && styles.inputError,
                      ]}
                      onPress={openDatePicker}
                      disabled={submitting}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons
                        name="calendar-outline"
                        size={18}
                        color={errors.join_date ? '#ef4444' : '#94a3b8'}
                      />
                      <Text
                        style={[
                          styles.input,
                          !form.join_date && { color: '#94a3b8' },
                        ]}
                      >
                        {form.join_date
                          ? formatDateDisplay(form.join_date)
                          : 'Pilih tanggal masuk'}
                      </Text>
                      <MaterialCommunityIcons
                        name="calendar-month-outline"
                        size={18}
                        color="#2563eb"
                      />
                    </TouchableOpacity>
                    {errors.join_date ? (
                      <Text style={styles.errorText}>
                        {Array.isArray(errors.join_date)
                          ? errors.join_date[0]
                          : errors.join_date}
                      </Text>
                    ) : null}
                  </View>

                  {/* Status */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Status</Text>
                    <View style={styles.roleRow}>
                      {[
                        { value: 'active', label: 'Aktif' },
                        { value: 'inactive', label: 'Non-Aktif' },
                      ].map((s) => {
                        const active = form.status === s.value;
                        return (
                          <TouchableOpacity
                            key={s.value}
                            style={[
                              styles.roleChip,
                              active && styles.roleChipActive,
                            ]}
                            onPress={() => setField('status', s.value)}
                            disabled={submitting}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.roleChipText,
                                active && styles.roleChipTextActive,
                              ]}
                            >
                              {s.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* ===== KEAMANAN ===== */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Keamanan</Text>

                  {renderInput({
                    label: isEdit
                      ? 'Password Baru (kosongkan jika tidak diubah)'
                      : 'Password',
                    key: 'password',
                    placeholder: isEdit ? '••••••' : 'Minimal 6 karakter',
                    icon: 'lock-outline',
                    secureTextEntry: true,
                    autoCapitalize: 'none',
                    required: !isEdit,
                  })}
                </View>

                {/* ===== ACTIONS ===== */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnCancel]}
                    onPress={handleCancel}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={18}
                      color="#475569"
                    />
                    <Text style={styles.btnCancelText}>Batal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.btn,
                      styles.btnSubmit,
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
                          name="content-save-outline"
                          size={18}
                          color="#ffffff"
                        />
                        <Text style={styles.btnSubmitText}>
                          {isEdit ? 'Simpan Perubahan' : 'Simpan'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      {/* ===== PICKER MODAL (dropdown select) ===== */}
      <Modal
        visible={picker.visible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closePicker}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{picker.title}</Text>
              <TouchableOpacity onPress={closePicker}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {picker.options.length === 0 ? (
              <View style={styles.modalEmpty}>
                <MaterialCommunityIcons
                  name="inbox-outline"
                  size={40}
                  color="#cbd5e1"
                />
                <Text style={styles.modalEmptyText}>
                  Belum ada data tersedia
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 360 }}>
                {picker.options.map((opt) => {
                  const selected = form[picker.key] === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.modalItem,
                        selected && styles.modalItemActive,
                      ]}
                      onPress={() => selectOption(opt)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          selected && styles.modalItemTextActive,
                        ]}
                      >
                        {opt.name}
                      </Text>
                      {selected && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={18}
                          color="#2563eb"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===== DATE PICKER (khusus iOS, Android pakai imperative API) ===== */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={cancelIosDate}
        >
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalCard}>
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={cancelIosDate}>
                  <Text style={styles.dateModalCancel}>Batal</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>Pilih Tanggal</Text>
                <TouchableOpacity onPress={confirmIosDate}>
                  <Text style={styles.dateModalDone}>Selesai</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onValueChange={onIosDateValueChange}
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      )}

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
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

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: 0.2,
  },

  field: { marginBottom: 12 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  required: { color: '#ef4444' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    paddingVertical: 0,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  roleChipText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  roleChipTextActive: { color: '#2563eb' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    borderRadius: 12,
  },
  btnCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnCancelText: { color: '#475569', fontSize: 14, fontWeight: '800' },
  btnSubmit: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#64748b', fontSize: 13, fontWeight: '600' },

  /* ===== MODAL PICKER (dropdown) ===== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modalItemActive: { backgroundColor: '#eff6ff' },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: '#2563eb',
    fontWeight: '800',
  },
  modalEmpty: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  modalEmptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },

  /* ===== DATE PICKER MODAL (iOS) ===== */
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  dateModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  dateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dateModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateModalCancel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  dateModalDone: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '800',
  },
});
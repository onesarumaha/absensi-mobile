import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ActionSheetAlert({
  visible,
  title,
  subtitle,
  actions = [], // [{ icon, label, color, onPress, danger }]
  cancelText = 'Batal',
  onClose,
}) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(40);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const animateClose = (callback) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 40,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => callback?.());
  };

  const handleClose = () => animateClose(onClose);

  const handleAction = (action) => {
    animateClose(() => {
      action?.onPress?.();
      onClose?.();
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header (nama pegawai) */}
          {(title || subtitle) && (
            <View style={styles.sheetHeader}>
              {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
              {subtitle ? (
                <Text style={styles.sheetSubtitle}>{subtitle}</Text>
              ) : null}
            </View>
          )}

          {/* Actions */}
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={() => handleAction(action)}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: action.danger ? '#fee2e2' : '#eff6ff' },
                ]}
              >
                <MaterialCommunityIcons
                  name={action.icon}
                  size={20}
                  color={action.danger ? '#dc2626' : action.color || '#2563eb'}
                />
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  action.danger && { color: '#dc2626' },
                ]}
              >
                {action.label}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#cbd5e1"
              />
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.7}
            onPress={handleClose}
          >
            <Text style={styles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
    width: width,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  sheetHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
});
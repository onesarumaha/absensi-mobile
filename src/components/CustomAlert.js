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

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Batal',
  onClose,
  onConfirm,
  showCancel = false,
}) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const animateClose = (callback) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
    });
  };

  const handleClose = () => animateClose(onClose);
  const handleConfirm = () =>
    animateClose(() => {
      onConfirm?.();
      onClose?.();
    });

  const config =
    {
      success: { icon: 'check-circle', color: '#22c55e', bg: '#dcfce7' },
      error: { icon: 'close-circle', color: '#ef4444', bg: '#fee2e2' },
      warning: { icon: 'alert', color: '#f59e0b', bg: '#fef3c7' },
      confirm: { icon: 'help-circle', color: '#3b82f6', bg: '#dbeafe' },
      info: { icon: 'information', color: '#3b82f6', bg: '#dbeafe' },
    }[type] || { icon: 'information', color: '#3b82f6', bg: '#dbeafe' };

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
          style={[styles.alertBox, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <MaterialCommunityIcons
              name={config.icon}
              size={44}
              color={config.color}
            />
          </View>

          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.divider} />

          <View style={styles.buttonRow}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.btnCancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnConfirm,
                { backgroundColor: config.color },
                !showCancel && { flex: 1 },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.btnConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  alertBox: {
    width: width - 60,
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
    marginVertical: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancel: { backgroundColor: '#f1f5f9' },
  btnCancelText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  btnConfirm: {},
  btnConfirmText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
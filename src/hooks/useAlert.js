import { useState } from 'react';

export function useAlert() {
  const [alert, setAlert] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Batal',
    showCancel: false,
    onConfirm: null,
  });

  const showAlert = ({
    type = 'info',
    title,
    message,
    confirmText,
    cancelText,
    showCancel = false,
    onConfirm,
  }) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      confirmText: confirmText || 'OK',
      cancelText: cancelText || 'Batal',
      showCancel,
      onConfirm,
    });
  };

  const hideAlert = () => setAlert((prev) => ({ ...prev, visible: false }));

  return { alert, showAlert, hideAlert };
}
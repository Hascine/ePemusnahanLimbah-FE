import Swal from 'sweetalert2';

// Success alert
export const showSuccess = (message, title = 'Success') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#10b981'
  });
};

// Error alert
export const showError = (message, title = 'Error') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ef4444'
  });
};

// Warning alert
export const showWarning = (message, title = 'Warning') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'warning',
    confirmButtonText: 'OK',
    confirmButtonColor: '#f59e0b'
  });
};

// Info alert
export const showInfo = (message, title = 'Information') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'info',
    confirmButtonText: 'OK',
    confirmButtonColor: '#3b82f6'
  });
};

// Confirmation dialog
export const showConfirmation = (message, title = 'Confirm Action') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#ef4444'
  });
};

// Generic alert (replaces basic alert())
export const showAlert = (message, type = 'info') => {
  const alertConfig = {
    success: { icon: 'success', color: '#10b981' },
    error: { icon: 'error', color: '#ef4444' },
    warning: { icon: 'warning', color: '#f59e0b' },
    info: { icon: 'info', color: '#3b82f6' }
  };

  const config = alertConfig[type] || alertConfig.info;

  return Swal.fire({
    text: message,
    icon: config.icon,
    confirmButtonText: 'OK',
    confirmButtonColor: config.color
  });
};
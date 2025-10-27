import { useState } from "react";

// Simple CSS icons as components
const XIcon = () => (
  <div className="w-5 h-5 relative">
    <div className="absolute top-2 left-0 w-5 h-0.5 bg-current transform rotate-45 origin-center"></div>
    <div className="absolute top-2 left-0 w-5 h-0.5 bg-current transform -rotate-45 origin-center"></div>
  </div>
);

const RejectModal = ({ isOpen, onClose, onConfirm, itemId, loading = false }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate reason
    if (!reason.trim()) {
      setError("Alasan penolakan harus diisi");
      return;
    }

    if (reason.trim().length < 10) {
      setError("Alasan penolakan minimal 10 karakter");
      return;
    }

    // Clear any previous errors
    setError("");
    
    // Call the confirm callback with reason
    onConfirm(itemId, reason.trim());
  };

  const handleClose = () => {
    if (!loading) {
      setReason("");
      setError("");
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        {/* Header */}
        <div className="text-center p-8 pb-4">
          {/* Error/Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Konfirmasi Penolakan
            </h3>
            <p className="text-gray-600">
              Anda yakin ingin menolak ajuan ini?
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 p-1"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-8 pb-4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(""); // Clear error when user starts typing
                }}
                placeholder="Masukkan alasan mengapa ajuan ini ditolak..."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-colors ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                rows={4}
                disabled={loading}
                maxLength={500}
              />
              <div className="flex justify-between mt-2">
                {error && (
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                )}
                <div className="flex-1"></div>
                <p className="text-xs text-gray-500">
                  {reason.length}/500 karakter
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-4 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="min-w-[120px] px-6 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="min-w-[120px] px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                'Reject'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;

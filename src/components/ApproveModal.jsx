const XIcon = () => (
  <div className="w-5 h-5 relative">
    <div className="absolute top-2 left-0 w-5 h-0.5 bg-current transform rotate-45 origin-center"></div>
    <div className="absolute top-2 left-0 w-5 h-0.5 bg-current transform -rotate-45 origin-center"></div>
  </div>
);

const ApproveModal = ({ isOpen, onClose, onConfirm, loading = false }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all">
        <div className="text-center p-8">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Konfirmasi Persetujuan</h3>
            <p className="text-gray-600">Anda yakin ingin menyetujui ajuan ini?</p>
          </div>

          {loading && (
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <XIcon />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="min-w-[100px] px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="min-w-[100px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors inline-flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              'Approve'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveModal;

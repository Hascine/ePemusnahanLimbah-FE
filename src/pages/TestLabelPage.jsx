import { useState } from "react";
import DownloadLabelModal from "../components/DownloadLabelModal";
import FieldVerificationModal from "../components/FieldVerificationModal";
import { showSuccess } from "../utils/sweetAlert";

const TestLabelPage = ({ onNavigate }) => {
  const [showModal, setShowModal] = useState(false);
  const [showFieldVerificationModal, setShowFieldVerificationModal] = useState(false);

  // Mock data untuk testing
  const mockAjuanData = {
    noPermohonan: "5630",
    status: "Approved", // Changed to show it's approved and ready for field verification
    details: {
      bentuk: "Cair",
      bagian: "Sefalosporin",
      jenisLimbah: "Produk jadi",
      kodeLimbah: "A336-1",
      golonganLimbah: "Sefalosporin"
    },
    lampiran: [
      {
        no: 1,
        jenisLimbah: "Produk jadi",
        kodeLimbah: "A336-1",
        namaLimbah: "Limbah Test 1",
        noBets: "BT001",
        noWadah: "1",
        satuan: "Drum",
        bobot: "25.5",
        alasanPemusnahan: "Sisa Produksi"
      },
      {
        no: 2,
        jenisLimbah: "Produk jadi", 
        kodeLimbah: "A336-1",
        namaLimbah: "Limbah Test 2",
        noBets: "BT002",
        noWadah: "2",
        satuan: "Drum",
        bobot: "30.2",
        alasanPemusnahan: "Sisa Produksi"
      },
      {
        no: 3,
        jenisLimbah: "Produk jadi",
        kodeLimbah: "A336-1", 
        namaLimbah: "Limbah Test 3",
        noBets: "BT003",
        noWadah: "3",
        satuan: "Drum",
        bobot: "28.7",
        alasanPemusnahan: "Sisa Produksi"
      }
    ]
  };

  const handleFieldVerificationComplete = (verificationData) => {
    console.log('Field verification completed:', verificationData);
    setShowFieldVerificationModal(false);
    
    // Here you would typically update the ajuan status in your backend
    // and show a success message
    showSuccess(`Verifikasi lapangan selesai dengan status: ${verificationData.status}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <button 
            onClick={() => onNavigate && onNavigate("dashboard")}
            className="text-gray-500 hover:text-gray-700"
          >
            Dashboard
          </button>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Test Label Download</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Label Download</h1>
            <p className="mt-2 text-gray-600">Halaman untuk testing fungsionalitas download label.</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate("dashboard")}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>

      {/* Test Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Download Label Modal</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Mock Data Information:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• No. Permohonan: {mockAjuanData.noPermohonan}</li>
              <li>• Status: {mockAjuanData.status}</li>
              <li>• Bentuk: {mockAjuanData.details.bentuk}</li>
              <li>• Bagian: {mockAjuanData.details.bagian}</li>
              <li>• Jumlah Wadah: {mockAjuanData.lampiran.length}</li>
              <li>• Jenis Limbah: {mockAjuanData.details.jenisLimbah}</li>
              <li>• Kode Limbah: {mockAjuanData.details.kodeLimbah}</li>
              <li>• <span className="font-medium">Status {mockAjuanData.status} - Siap untuk verifikasi lapangan</span></li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Lampiran Data:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Limbah</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No. Wadah</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Satuan</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bobot (gram)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockAjuanData.lampiran.map((item) => (
                    <tr key={item.no}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.no}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.namaLimbah}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.noWadah}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.satuan}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.bobot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
            >
              🏷️ Test Download Label Modal
            </button>
            
            <button
              onClick={() => setShowFieldVerificationModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              ✅ Test Field Verification Modal
            </button>
            
            <div className="text-sm text-gray-500 flex items-center">
              <div>
                <p>• Modal akan menampilkan preview label dengan data mock</p>
                <p>• Anda dapat test download dalam berbagai ukuran</p>
                <p>• Label akan dibuat untuk setiap wadah</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Label Modal */}
      <DownloadLabelModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        requestId="5630" // Mock request ID for testing
        useMockData={true} // Enable mock data for testing
      />

      {/* Field Verification Modal */}
      <FieldVerificationModal
        isOpen={showFieldVerificationModal}
        onClose={() => setShowFieldVerificationModal(false)}
        onComplete={handleFieldVerificationComplete}
        ajuanData={mockAjuanData}
      />
    </div>
  );
};

export default TestLabelPage;

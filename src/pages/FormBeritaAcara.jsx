import { useState, useEffect } from "react";
import { dataAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { toJakartaIsoFromLocal, formatDateID, formatDateTimeID, formatTimeID, formatTimeHHMM } from "../utils/time";
import { showSuccess, showError, showWarning, showInfo, showConfirmation } from "../utils/sweetAlert";

// Simple CSS icons as components
const ChevronDownIcon = () => (
  <div className="w-4 h-4 flex items-center justify-center">
    <div className="w-2 h-2 border-b-2 border-r-2 border-current transform rotate-45"></div>
  </div>
);

function formatDateToDDMMYYYY(dateStr) {
  // Use centralized Jakarta formatter; if input is an ISO or date-like, format as DD/MM/YYYY
  if (!dateStr) return '';
  const f = formatDateID(dateStr);
  return f || String(dateStr);
}

function formatTime24Hour(timeStr) {
  if (!timeStr) return '';
  // If already an HH:MM:SS string, normalize; otherwise try to parse via Jakarta util
  if (timeStr.includes(':')) {
    const [h,m,s] = timeStr.split(':');
    return `${(h||'00').padStart(2,'0')}:${(m||'00').padStart(2,'0')}:${(s||'00').padStart(2,'0')}`;
  }
  // Fallback: try formatting as Jakarta time
  // formatTimeHHMM returns HH:MM; prefer formatTimeID which returns HH:MM:SS
  const f = formatTimeID(timeStr);
  return f || String(timeStr);
}

const FormBeritaAcara = ({ onNavigate }) => {
  const { user } = useAuth();

  const getLocalDateISO = () => {
    // Build Jakarta ISO from local now and take YYYY-MM-DD portion so date inputs match Jakarta date
    const iso = toJakartaIsoFromLocal();
    return iso.split('T')[0];
  };

  const getLocalTimeHHMMSS = () => {
    // Build Jakarta ISO and extract time components
    const iso = toJakartaIsoFromLocal();
    const timePart = iso.split('T')[1] || '';
    const hhmmss = timePart.split('+')[0] || '';
    return hhmmss || '00:00:00';
  };

  const [form, setForm] = useState({
    bagian: user?.emp_DeptID || user?.Bagian || user?.bagian || user?.department || user?.Department || "",
    tanggal: getLocalDateISO(), // Current local date in YYYY-MM-DD format
    jam: getLocalTimeHHMMSS(), // Current local time in HH:MM:SS format
    lokasiVerifikasi: "TPS",
    pelaksanaBagian: "",
    supervisorBagian: "",
    pelaksanaHSE: "",
    supervisorHSE: ""
  });

  const [showDaftarPemusnahan, setShowDaftarPemusnahan] = useState(false);
  const [daftarPemusnahan, setDaftarPemusnahan] = useState([]);
  const [daftarGenerated, setDaftarGenerated] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatorAllowed, setIsCreatorAllowed] = useState(false);
  const [creatorCheckLoading, setCreatorCheckLoading] = useState(true);

  // Update bagian when user changes
  useEffect(() => {
    if (user?.emp_DeptID) {
      const deptMapping = {
        'NT': 'NT',
        'WH': 'WH',
        'Information Technology': 'NT',
        'Warehouse': 'WH'
      };
      
      const mappedDept = deptMapping[user.emp_DeptID] || user.emp_DeptID;
      
      setForm(prev => ({
        ...prev,
        bagian: mappedDept
      }));
    }
  }, [user]);

  // Check if current user is allowed to create Berita Acara (Appr_No=1 and Appr_DeptID='KL')
  useEffect(() => {
    let mounted = true;
    const checkCreator = async () => {
      setCreatorCheckLoading(true);
      try {
        const res = await dataAPI.getExternalApprovalList(1);
        if (res.data.success) {
          const items = res.data.data || [];
          const appItems = items.filter(i => String(i.Appr_ApplicationCode || '') === 'ePengelolaan_Limbah_Berita_Acara');
          const myNik = user && (user.log_NIK || user.emp_NIK || user.log_nik || user.NIK);
          const allowed = appItems.some(it => String(it.Appr_DeptID || '').toUpperCase() === 'KL' && String(it.Appr_ID) === String(myNik));
          if (mounted) setIsCreatorAllowed(allowed);
        } else {
          if (mounted) setIsCreatorAllowed(false);
        }
      } catch (err) {
        console.error('Error checking creator permission:', err);
        if (mounted) setIsCreatorAllowed(false);
      } finally {
        if (mounted) setCreatorCheckLoading(false);
      }
    };

    checkCreator();
    return () => { mounted = false; };
  }, [user]);

  // Reset daftar pemusnahan when bagian or tanggal changes
  useEffect(() => {
    if (daftarGenerated) {
      setDaftarGenerated(false);
      setDaftarPemusnahan([]);
    }
  }, [form.bagian, form.tanggal]);

  // Add beforeunload event listener to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const hasFormData = Object.values(form).some(value => 
        typeof value === 'string' && value.trim() !== '' && value !== user?.emp_DeptID
      );
      
      if (hasFormData || daftarPemusnahan.length > 0) {
        const message = "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?";
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, daftarPemusnahan, user]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchDaftarPemusnahan = async () => {
    if (!form.bagian || !form.tanggal) {
      showWarning("Bagian dan tanggal harus diisi terlebih dahulu");
      return;
    }

    setIsGenerating(true);
    try {
      // Request server to return only requests for this bagian and tanggal
      const response = await dataAPI.getAvailableRequestsForDailyLog({ bagian: form.bagian, tanggal: form.tanggal });

      if (response.data.success) {
        setDaftarPemusnahan(response.data.data || []);
        setDaftarGenerated(true);

        if ((response.data.data || []).length === 0) {
          showInfo(`Tidak ada permohonan yang selesai untuk bagian ${form.bagian} pada tanggal ${form.tanggal}`);
        }
      } else {
        setDaftarPemusnahan([]);
        setDaftarGenerated(false);
        showError("Error: " + (response.data.message || "Failed to fetch available requests"));
      }
      
    } catch (error) {
      console.error('Error fetching daftar pemusnahan:', error);
      setDaftarPemusnahan([]);
      setDaftarGenerated(false);
      showError("Terjadi kesalahan saat mengambil data pemusnahan");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setForm({
      bagian: user?.emp_DeptID || user?.Bagian || user?.bagian || user?.department || user?.Department || "",
      tanggal: getLocalDateISO(),
      jam: getLocalTimeHHMMSS(),
      lokasiVerifikasi: "TPS",
      pelaksanaBagian: "",
      supervisorBagian: "",
      pelaksanaHSE: "",
      supervisorHSE: ""
    });
    setDaftarPemusnahan([]);
    setDaftarGenerated(false);
  };

  const handleCancel = async () => {
    const hasFormData = Object.values(form).some(value => 
      typeof value === 'string' && value.trim() !== '' && value !== user?.emp_DeptID
    );
    
    if (hasFormData || daftarPemusnahan.length > 0) {
      const result = await showConfirmation(
        "Apakah Anda yakin ingin membatalkan? Semua data yang belum disimpan akan hilang.",
        "Konfirmasi Batal"
      );
      
      if (!result.isConfirmed) {
        return;
      }
    }
    
    resetForm();
    
    if (onNavigate) {
      onNavigate("berita-acara");
    }
  };

  const handleKembali = async () => {
    const hasFormData = Object.values(form).some(value => 
      typeof value === 'string' && value.trim() !== '' && value !== user?.emp_DeptID
    );
    
    if (hasFormData || daftarPemusnahan.length > 0) {
      const result = await showConfirmation(
        "Apakah Anda yakin ingin kembali? Semua data yang belum disimpan akan hilang.",
        "Konfirmasi Kembali"
      );
      
      if (!result.isConfirmed) {
        return;
      }
    }
    
    resetForm();
    
    if (onNavigate) {
      onNavigate("berita-acara");
    }
  };

  const validateFormData = () => {
    const errors = [];

    if (!form.bagian.trim()) {
      errors.push("Bagian harus diisi");
    }
    if (!form.tanggal) {
      errors.push("Tanggal harus diisi");
    }
    if (!form.jam) {
      errors.push("Jam/Waktu harus diisi");
    }
    if (!form.lokasiVerifikasi.trim()) {
      errors.push("Lokasi verifikasi harus diisi");
    }
    if (!form.pelaksanaBagian.trim()) {
      errors.push("Pelaksana Bagian harus diisi");
    }
    if (!form.supervisorBagian.trim()) {
      errors.push("Supervisor/Officer Bagian harus diisi");
    }
    if (!form.pelaksanaHSE.trim()) {
      errors.push("Pelaksana HSE harus diisi");
    }
    if (!form.supervisorHSE.trim()) {
      errors.push("Supervisor/Officer HSE harus diisi");
    }

    if (daftarPemusnahan.length === 0) {
      errors.push("Silakan generate daftar pemusnahan terlebih dahulu");
    }

    // Ensure at least one row is selected when creating Berita Acara
    if (daftarPemusnahan.length > 0 && selectedRequestIds.length === 0) {
      errors.push("Silakan pilih minimal 1 baris dari daftar pemusnahan untuk dibuat Berita Acara");
    }

    return errors;
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      showError("Mohon perbaiki kesalahan berikut:\n\n" + validationErrors.join("\n"));
      return;
    }
    if (!isCreatorAllowed) {
      showError('Anda tidak memiliki hak untuk membuat Berita Acara. Hanya Supervisor/Officer HSE yang dapat membuat.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for API call according to backend BeritaAcara model
      // Build a timezone-aware ISO datetime for the selected local date+time
      // This ensures the backend receives an unambiguous UTC timestamp (with Z)
      // while preserving the original local date/time entered by the user.
      // Build Jakarta ISO from the local components (explicit +07:00 offset)
      const buildLocalIso = () => {
        try {
          // Prefer centralized builder from util by combining date and time into a Date then generating Jakarta ISO
          const [y, m, d] = (form.tanggal || '').split('-').map(Number);
          const [hh, mm, ss] = (form.jam || '00:00:00').split(':').map(Number);
          const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
          return toJakartaIsoFromLocal(dt);
        } catch (e) {
          return toJakartaIsoFromLocal();
        }
      };

      const beritaAcaraData = {
        bagian: form.bagian,
        tanggal: form.tanggal, // Date field (YYYY-MM-DD local)
        waktu: buildLocalIso(), // send explicit Jakarta +07:00 ISO built from local inputs
        lokasi_verifikasi: form.lokasiVerifikasi,
        pelaksana_bagian: form.pelaksanaBagian,
        supervisor_bagian: form.supervisorBagian,
        pelaksana_hse: form.pelaksanaHSE,
        supervisor_hse: form.supervisorHSE
        ,
        // Include selected request IDs to process only chosen rows
        selectedRequestIds: selectedRequestIds
      };
      
      console.log('Berita Acara data to submit:', beritaAcaraData);
      
      const response = await dataAPI.createBeritaAcara(beritaAcaraData);
      
      if (response.data.success) {
        showSuccess(response.data.message || "Berita acara berhasil dibuat!");
        
        // Navigate back to berita acara list
        // Clear local daftar and selections then navigate
        setDaftarPemusnahan([]);
        setDaftarGenerated(false);
        setSelectedRequestIds([]);
        if (onNavigate) {
          onNavigate("berita-acara");
        }
      } else {
        showError("Error: " + (response.data.message || "Failed to create berita acara"));
      }
    } catch (error) {
      console.error('Error creating berita acara:', error);
      showError("Error saving berita acara.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPemohon = user?.role === "Pemohon";

  return (
    <div className="p-6">
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <span>Limbah B3</span>
          <span className="mx-2">›</span>
          <span>Berita Acara Pemusnahan</span>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Tambah Berita Acara</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tambah Berita Acara Pemusnahan</h1>
            <p className="mt-2 text-gray-600">Form untuk menambah berita acara pemusnahan.</p>
          </div>
          <button
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            onClick={handleKembali}
          >
            Kembali
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bagian</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="bagian"
                  value={form.bagian}
                  onChange={handleFormChange}
                >
                  <option value="">Pilih Bagian</option>
                  <option value="NT">NT</option>
                  <option value="WH">WH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam/Waktu</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="jam"
                  type="time"
                  step="1"
                  value={form.jam}
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Verifikasi</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="lokasiVerifikasi"
                  type="text"
                  value={form.lokasiVerifikasi}
                  onChange={handleFormChange}
                  placeholder="Lokasi Verifikasi"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pelaksana Bagian</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="pelaksanaBagian"
                  type="text"
                  value={form.pelaksanaBagian}
                  onChange={handleFormChange}
                  placeholder="Pelaksana Bagian"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor/Officer Bagian</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="supervisorBagian"
                  type="text"
                  value={form.supervisorBagian}
                  onChange={handleFormChange}
                  placeholder="Supervisor/Officer Bagian"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pelaksana HSE</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="pelaksanaHSE"
                  type="text"
                  value={form.pelaksanaHSE}
                  onChange={handleFormChange}
                  placeholder="Pelaksana HSE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor/Officer HSE</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="supervisorHSE"
                  type="text"
                  value={form.supervisorHSE}
                  onChange={handleFormChange}
                  placeholder="Supervisor/Officer HSE"
                />
              </div>
            </div>

            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
              <button 
                type="button"
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors duration-200"
                onClick={() => setShowDaftarPemusnahan(!showDaftarPemusnahan)}
              >
                <h3 className="text-lg font-semibold text-gray-900">Daftar Pemusnahan</h3>
                <ChevronDownIcon className={`h-5 w-5 transform transition-transform duration-200 text-gray-500 ${showDaftarPemusnahan ? 'rotate-180' : ''}`} />
              </button>
              
              {showDaftarPemusnahan && (
                <div className="p-4">
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Informasi:</strong> Data secara otomatis terisi berdasarkan bagian dan tanggal pembuatan berita acara.
                    </p>
                  </div>

                  {/* Generate Button */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={fetchDaftarPemusnahan}
                      disabled={!form.bagian || !form.tanggal || isGenerating}
                      className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        "Generate Daftar Pemusnahan"
                      )}
                    </button>
                    {(!form.bagian || !form.tanggal) && (
                      <p className="mt-2 text-sm text-gray-500">
                        Pilih bagian dan tanggal terlebih dahulu untuk generate daftar pemusnahan.
                      </p>
                    )}
                  </div>

                  {/* Selection controls - placed outside the table */}
                  {daftarGenerated && daftarPemusnahan.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="inline-flex items-center text-sm text-gray-700">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-green-600 mr-2"
                              checked={selectedRequestIds.length === daftarPemusnahan.length && daftarPemusnahan.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRequestIds(daftarPemusnahan.map(i => i.request_id));
                                } else {
                                  setSelectedRequestIds([]);
                                }
                              }}
                            />
                            Select all ({daftarPemusnahan.length} items)
                          </label>
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          Selected: {selectedRequestIds.length} / {daftarPemusnahan.length}
                        </div>
                      </div>
                    </div>
                  )}

                  {daftarGenerated && daftarPemusnahan.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-green-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-12">
                              {/* Select */}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              No. Permohonan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Bentuk Limbah
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Golongan Limbah
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Jenis Limbah
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Jumlah Item
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Bobot Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Alasan Pemusnahan
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {daftarPemusnahan.map((item, index) => (
                            <tr key={item.request_id || item.id || item.noPermohonan || index} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-green-600"
                                  checked={selectedRequestIds.includes(item.request_id)}
                                  onChange={(ev) => {
                                    const checked = ev.target.checked;
                                    setSelectedRequestIds(prev => {
                                      if (checked) return [...new Set([...prev, item.request_id])];
                                      return prev.filter(id => id !== item.request_id);
                                    });
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.noPermohonan}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.bentukLimbah}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.golonganLimbah}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.jenisLimbah}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.jumlahItem}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.bobotTotal}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.alasanPemusnahan}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : daftarGenerated && daftarPemusnahan.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Tidak ada data pemusnahan untuk bagian dan tanggal yang dipilih.</p>
                      <p className="text-sm mt-1">Silakan periksa kembali bagian dan tanggal yang dimasukkan.</p>
                    </div>
                  ) : !daftarGenerated ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>Klik tombol "Generate Daftar Pemusnahan" untuk melihat data.</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </form>
        </div>
        
        {/* Main form action buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              onClick={handleCancel}
            >
              Cancel
            </button>
            {isPemohon && (
              <button
                type="button"
                className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveDraft}
                disabled={isSubmitting || selectedRequestIds.length === 0}
                title={selectedRequestIds.length === 0 ? 'Pilih minimal 1 baris dari daftar pemusnahan' : ''}
              >
                {isSubmitting ? "Creating..." : "Create Berita Acara"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBeritaAcara;

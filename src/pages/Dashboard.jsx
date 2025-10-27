import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import { showSuccess, showError, showWarning } from "../utils/sweetAlert"

const Dashboard = ({ onNavigate }) => {
  const { user, fetchProfile } = useAuth()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFetchProfile = async () => {
    const result = await fetchProfile()
    if (result?.success) {
      showSuccess('Profile updated successfully!')
    } else {
      showError('Failed to fetch profile: ' + (result?.error || 'Unknown error'))
    }
  }

  const handleGenerateLogbook = async () => {
    if (!startDate || !endDate) {
      showWarning('Silakan pilih tanggal mulai dan tanggal akhir')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      showWarning('Tanggal mulai tidak boleh lebih besar dari tanggal akhir')
      return
    }

    setIsGenerating(true)
    
    try {
      const result = await api.downloadLogbookExcel(startDate, endDate)
      
      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to generate logbook')
      }

      // Create blob and download file
      const blob = new Blob([result.data.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `logbook-limbah-b3-${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error generating logbook:', error)
      showError('Gagal generate logbook: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to e-System Limbah B3</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Applications</h3>
          <p className="text-3xl font-bold text-green-600">24</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Approvals</h3>
          <p className="text-3xl font-bold text-yellow-600">8</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">16</p>
        </div>
      </div>

      {/* User Info Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{user?.Nama || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">NIK</label>
              <p className="text-gray-900">{user?.log_NIK || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Position</label>
              <p className="text-gray-900">{user?.Jabatan || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p className="text-gray-900">{user?.emp_DeptID || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Delegated To Section */}
        {user?.delegatedTo && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delegated To</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{user.delegatedTo.Nama || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NIK</label>
                  <p className="text-gray-900">{user.delegatedTo.log_NIK || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="text-gray-900">{user.delegatedTo.Jabatan || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-gray-900">{user.delegatedTo.emp_DeptID || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Logbook Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Generate Logbook</h2>        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <button
              onClick={handleGenerateLogbook}
              disabled={isGenerating || !startDate || !endDate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Logbook'
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-blue-600">
          <p>• Logbook akan mengelompokkan data berdasarkan jenis limbah</p>
          <p>• Setiap jenis limbah akan memiliki sheet terpisah</p>
          <p>• Data diambil dari permohonan dengan status Completed</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

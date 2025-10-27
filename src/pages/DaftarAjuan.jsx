import { useState } from "react";
import DataTable from "../components/DataTable";
import { useAuth } from "../contexts/AuthContext";
import { showInfo } from "../utils/sweetAlert";

const DaftarAjuan = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-requests");
  
  // All authenticated users are allowed to create a new permohonan
  const canCreateAjuan = !!user;

  // Check if user has approval authority (Manager, HSE, or other approval roles)
  // Also include PJKPO users based on their log_NIK
  const hasApprovalAuthority = (user?.role && ["Manager", "HSE", "APJ", "QA"].includes(user.role)) || 
                               (user?.log_NIK === "PJKPO");

  const handleAddApplication = () => {
    // Navigate to form page when implemented
    if (onNavigate) {
      onNavigate("tambah-ajuan-pemusnahan");
    } else {
      showInfo("Add application functionality will be implemented here");
    }
  };

  const tabs = [
    {
      id: "my-requests",
      label: "My Requests",
    }
  ];

  // Add pending approvals tab if user has approval authority
  if (hasApprovalAuthority) {
    tabs.push({
      id: "pending-approvals", 
      label: "Pending Approvals",
    });
    // Also add Approved tab to view items already approved
    tabs.push({
      id: "approved",
      label: "Approved",
    });
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <span>Limbah B3</span>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Daftar Ajuan Pemusnahan</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daftar Ajuan Pemusnahan</h1>
            <p className="mt-2 text-gray-600">
              {activeTab === "my-requests" && "Daftar ajuan pemusnahan yang telah Anda buat."}
              {activeTab === "pending-approvals" && "Daftar ajuan pemusnahan yang menunggu persetujuan Anda."}
              {activeTab === "approved" && "Daftar ajuan pemusnahan yang telah Anda setujui."}
            </p>
          </div>
          {(canCreateAjuan || (user?.delegatedTo && hasApprovalAuthority)) && activeTab === "my-requests" && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              onClick={handleAddApplication}
            >
              <span className="text-lg leading-none">+</span>
              <span>Tambah Ajuan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation - only show if user has approval authority */}
      {hasApprovalAuthority && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <DataTable 
        onNavigate={onNavigate} 
        viewMode={activeTab}
        userRole={user?.role}
        currentUser={user}
      />
    </div>
  );
};

export default DaftarAjuan;

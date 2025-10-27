"use client"

import { useState, useEffect } from "react";
import { dataAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useConfigContext } from "../contexts/ConfigContext";
import { getBeritaAcaraStatusDisplayName } from "../constants/referenceData";
import { formatDateID, formatDateTimeID, toJakartaIsoFromLocal } from "../utils/time";
import { showInfo } from "../utils/sweetAlert";

// Simple CSS icons as components
const SearchIcon = () => (
  <div className="w-4 h-4 border border-gray-400 rounded-full relative">
    <div className="absolute top-2 left-2 w-1 h-1 border border-gray-400 transform rotate-45"></div>
  </div>
);

const FilterIcon = () => (
  <div className="w-4 h-4 relative">
    <div className="w-full h-0.5 bg-gray-400 mb-1"></div>
    <div className="w-3 h-0.5 bg-gray-400 mb-1 mx-auto"></div>
    <div className="w-2 h-0.5 bg-gray-400 mx-auto"></div>
  </div>
);

const ChevronLeftIcon = () => (
  <div className="w-4 h-4 flex items-center justify-center">
    <div className="w-2 h-2 border-l-2 border-b-2 border-gray-400 transform rotate-45"></div>
  </div>
);

const ChevronRightIcon = () => (
  <div className="w-4 h-4 flex items-center justify-center">
    <div className="w-2 h-2 border-r-2 border-t-2 border-gray-400 transform rotate-45"></div>
  </div>
);

const ChevronDownIcon = () => (
  <div className="w-4 h-4 flex items-center justify-center">
    <div className="w-2 h-2 border-b-2 border-r-2 border-gray-400 transform rotate-45"></div>
  </div>
);

// Use centralized Jakarta-aware formatter for dates so displayed values equal stored values
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  // Prefer Jakarta-based display; if timestamp appears to be an ISO or date string, pass through
  // formatDateID which understands YYYY-MM-DD or full ISO with time and explicit offset.
  // We keep backwards-compatible fallback: if parse fails, return original string.
  const formatted = formatDateID(timestamp);
  return formatted || String(timestamp);
};

const BeritaAcaraDataTable = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 8;
  const { user } = useAuth();
  const { getStatusStyle } = useConfigContext();

  useEffect(() => {
    const fetchBeritaAcara = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await dataAPI.getBeritaAcara({
          page: currentPage,
          limit: itemsPerPage,
          searchTerm: searchTerm,
          selectedColumn: selectedColumn,
        });
        
        if (response.data.success) {
          // Keep backend field names; API already added `id`.
          const transformedData = response.data.data.map(item => ({ ...item }));
          
          setData(transformedData);
          setTotalItems(response.data.pagination.total);
        } else {
          setError(response.data.message || 'Failed to fetch berita acara');
          setData([]);
          setTotalItems(0);
        }
        setLoading(false);
        
      } catch (err) {
        console.error("Error fetching berita acara:", err);
        setError("Error fetching data.");
        setLoading(false);
      }
    };

    fetchBeritaAcara();
  }, [currentPage, searchTerm, selectedColumn, user]);

  // Define column mappings based on backend BeritaAcara model
  const columnOptions = [
    { value: "tanggal", label: "Tgl. Pemusnahan" },
    { value: "bagian", label: "Bagian" },
    { value: "lokasi_verifikasi", label: "Lokasi" },
    { value: "status", label: "Status" }
  ];

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Reset to first page when filters change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleColumnChange = (e) => {
    setSelectedColumn(e.target.value);
    setCurrentPage(1);
  };

  const handleView = async (id) => {
    if (onNavigate) {
      onNavigate('detail-berita-acara', { id: id });
    } else {
      showInfo("View berita acara functionality will be implemented here");
    }
  };

  // Role-based permissions
  const isPemohon = user?.role === "Pemohon";
  const isManager = user?.role === "Manager";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Search and Filter Controls */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder={selectedColumn ? `Search in ${columnOptions.find(col => col.value === selectedColumn)?.label}...` : "Search across all columns..."}
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Icon */}
            <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FilterIcon />
            </button>

            {/* Column Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedColumn}
                onChange={handleColumnChange}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">- All Columns -</option>
                {columnOptions.map((column) => (
                  <option key={column.value} value={column.value}>
                    {column.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Status Display */}
        {(searchTerm || selectedColumn) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <span>Filtering:</span>
            {selectedColumn && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Column: {columnOptions.find(col => col.value === selectedColumn)?.label}
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedColumn("");
                setCurrentPage(1);
              }}
              className="text-red-600 hover:text-red-800 text-xs underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tgl. Pemusnahan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bagian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lokasi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  Loading data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((item, idx) => (
                <tr key={item.id || item.berita_acara_id || item.request_id || `row-${idx}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTimestamp(item.tanggal)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bagian}</td>                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lokasi_verifikasi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        style={getStatusStyle(item.status)}
                      >
                        {getBeritaAcaraStatusDisplayName(item.status, item.currentStepLevel)}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 text-xs bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition-colors"
                        onClick={() => handleView(item.id)}
                        title="View Details"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No data available.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, totalItems)} results of {totalItems}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Page</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={totalPages === 0}
              >
                {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((page) => (
                  <option key={page} value={page}>
                    {page.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeritaAcaraDataTable;

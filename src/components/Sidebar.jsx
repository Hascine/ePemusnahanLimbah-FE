"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "../contexts/AuthContext"

// SVG Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z" />
  </svg>
)

const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const AdminIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const groupKeyMap = {
  "berita-acara": "limbah-b3",
  "recall-berita-acara": "recall",
  "recall-precursor-berita-acara": "recall-precursor",
}

const Sidebar = ({ currentPage, onNavigate, isCollapsed, setIsCollapsed, hasPendingApproval, pendingApprovalByGroup = {} }) => {
  const sidebarRef = useRef(null)
  const { user } = useAuth()
  const [isLimbahExpanded, setIsLimbahExpanded] = useState(true)
  const [isRecallExpanded, setIsRecallExpanded] = useState(true)
  const [isRecallPrecursorExpanded, setIsRecallPrecursorExpanded] = useState(true)
  const [usesHoverSidebar, setUsesHoverSidebar] = useState(() => {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches
  })
  const totalPendingApprovals = Object.values(pendingApprovalByGroup).reduce((sum, count) => sum + Number(count || 0), 0)
  const hasAnyPendingApproval = hasPendingApproval || totalPendingApprovals > 0
  const userInitial = user?.Inisial_Name?.charAt(0) || user?.Nama?.charAt(0) || "A"

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
    const handleMediaChange = (event) => {
      setUsesHoverSidebar(event.matches)
      setIsCollapsed(true)
    }

    setUsesHoverSidebar(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleMediaChange)

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange)
    }
  }, [setIsCollapsed])

  useEffect(() => {
    if (usesHoverSidebar || isCollapsed) return

    const handleOutsidePointerDown = (event) => {
      if (!sidebarRef.current?.contains(event.target)) {
        setIsCollapsed(true)
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown)
    }
  }, [isCollapsed, setIsCollapsed, usesHoverSidebar])

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <DashboardIcon />,
      page: "dashboard",
      onClick: () => onNavigate("dashboard"),
    },
    {
      id: "limbah-b3",
      label: "Limbah B3",
      icon: <FileIcon />,
      hasSubmenu: true,
      isExpanded: isLimbahExpanded,
      onToggle: () => setIsLimbahExpanded(!isLimbahExpanded),
      submenu: [
        {
          id: "daftar-ajuan",
          label: "Daftar Ajuan Pemusnahan",
          page: "daftar-ajuan-b3",
          onClick: () => onNavigate("daftar-ajuan", { group: "limbah-b3", pageAlias: "daftar-ajuan-b3" }),
        },
        {
          id: "berita-acara",
          label: "Berita Acara Pemusnahan",
          page: "berita-acara-b3",
          onClick: () => onNavigate("berita-acara", { group: "limbah-b3", pageAlias: "berita-acara-b3" }),
        },
      ],
    },
    {
      id: "recall",
      label: "Recall",
      icon: <FileIcon />,
      hasSubmenu: true,
      isExpanded: isRecallExpanded,
      onToggle: () => setIsRecallExpanded(!isRecallExpanded),
      submenu: [
        {
          id: "recall-ajuan",
          label: "Daftar Ajuan Pemusnahan",
          page: "daftar-ajuan-recall",
          onClick: () => onNavigate("daftar-ajuan", { group: "recall", pageAlias: "daftar-ajuan-recall" }),
        },
        {
          id: "recall-berita-acara",
          label: "Berita Acara Pemusnahan",
          page: "berita-acara-recall",
          onClick: () => onNavigate("berita-acara", { group: "recall", pageAlias: "berita-acara-recall" }),
        },
      ],
    },
    {
      id: "recall-precursor-oot",
      label: "Precursor & OOT",
      icon: <FileIcon />,
      hasSubmenu: true,
      isExpanded: isRecallPrecursorExpanded,
      onToggle: () => setIsRecallPrecursorExpanded(!isRecallPrecursorExpanded),
      submenu: [
        {
          id: "recall-precursor-ajuan",
          label: "Daftar Ajuan Pemusnahan",
          page: "daftar-ajuan-recall-precursor-oot",
          onClick: () => onNavigate("daftar-ajuan", { group: "recall-precursor", pageAlias: "daftar-ajuan-recall-precursor-oot" }),
        },
        {
          id: "recall-precursor-berita-acara",
          label: "Berita Acara Pemusnahan",
          page: "berita-acara-recall-precursor-oot",
          onClick: () => onNavigate("berita-acara", { group: "recall-precursor", pageAlias: "berita-acara-recall-precursor-oot" }),
        },
      ],
    },
    {
      id: "audit-log-download",
      label: "Audit Trail",
      icon: <DownloadIcon />,
      page: "audit-log-download",
      onClick: () => onNavigate("audit-log-download"),
    },
    /*
    {
      id: "notifications",
      label: "Notifications",
      icon: <BellIcon />,
      badge: "01",
      page: "notifications",
      onClick: () => onNavigate("notifications"),
    },
    {
      id: "workflow-admin",
      label: "Workflow Admin",
      icon: <AdminIcon />,
      page: "workflow-admin",
      onClick: () => onNavigate("workflow-admin"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: <SettingsIcon />,
      page: "settings",
      onClick: () => onNavigate("settings"),
    },
    */
  ]

  const isItemActive = (item) => {
    if (currentPage === item.page) return true
    return item.submenu?.some((subItem) => subItem.page === currentPage)
  }

  const getItemPendingCount = (item) => {
    if (!item.submenu) return 0
    return item.submenu.reduce((sum, subItem) => {
      const groupKey = groupKeyMap[subItem.id]
      return sum + Number(groupKey ? pendingApprovalByGroup[groupKey] || 0 : 0)
    }, 0)
  }

  const handleSidebarPointerDownCapture = (event) => {
    if (!usesHoverSidebar && isCollapsed) {
      event.preventDefault()
      event.stopPropagation()
      setIsCollapsed(false)
    }
  }

  return (
    <aside
      ref={sidebarRef}
      onPointerDownCapture={handleSidebarPointerDownCapture}
      onMouseEnter={usesHoverSidebar ? () => setIsCollapsed(false) : undefined}
      onMouseLeave={usesHoverSidebar ? () => setIsCollapsed(true) : undefined}
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white/95 backdrop-blur border-r border-gray-200/80 flex flex-col h-[calc(100vh-4rem)] fixed left-0 top-16 transition-all duration-300 z-40 shadow-[8px_0_24px_rgba(15,23,42,0.06)]`}
    >
      {/* User Profile - Hidden when collapsed */}
      {!isCollapsed && (
        <div className="p-3 border-b border-gray-100">
          <div className="rounded-lg bg-gradient-to-br from-green-50 via-white to-emerald-50 border border-green-100/80 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="relative w-11 h-11 bg-green-700 rounded-lg flex items-center justify-center text-white font-semibold shadow-sm">
                  <span>{userInitial}</span>
                  <span className="absolute -right-1 -bottom-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {user?.Inisial_Name || "NIK"}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {user?.emp_DeptID || "DEPT"}
                  </div>
                  {/* Show delegation info if exists */}
                  {user?.delegatedTo && (
                    <div className="text-xs text-green-700 truncate mt-1.5 font-medium">
                      Operated by: {user.delegatedTo.Inisial_Name}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-md transition-colors"
                title="Collapse sidebar"
              >
                <XIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button when collapsed */}
      {isCollapsed && (
        <div className="p-2 border-b border-gray-100">
          <button
            onClick={() => setIsCollapsed(false)}
            className="relative w-full p-2.5 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <MenuIcon />
            {hasAnyPendingApproval && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {!isCollapsed && (
          <div className="px-2 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Navigation
          </div>
        )}
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const active = isItemActive(item)
            const pendingCount = getItemPendingCount(item)

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center h-11 px-2' : 'justify-between min-h-11 px-2.5 py-2'} rounded-lg cursor-pointer transition-all duration-200 ${
                    active
                      ? "bg-green-700 text-white shadow-sm"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-800"
                  }`}
                  onClick={item.hasSubmenu ? item.onToggle : item.onClick}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isCollapsed ? (
                    // Collapsed view - only icon
                    <>
                      <span className={`${active ? "text-white" : "text-gray-500 group-hover:text-green-700"}`}>{item.icon}</span>
                      {pendingCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full ring-2 ring-white">
                          {pendingCount > 9 ? "9+" : pendingCount}
                        </span>
                      )}
                    </>
                  ) : (
                    // Expanded view - full menu
                    <>
                      <div className="flex items-center min-w-0 gap-3">
                        <span className={`shrink-0 ${active ? "text-white" : "text-gray-500 group-hover:text-green-700"}`}>
                          {item.icon}
                        </span>
                        <span className="text-sm font-semibold truncate">{item.label}</span>
                        {pendingCount > 0 && (
                          <span className={`${active ? "bg-white/20 text-white" : "bg-red-50 text-red-600"} shrink-0 min-w-5 h-5 px-1.5 text-xs leading-5 rounded-full text-center font-semibold`}>
                            {pendingCount > 99 ? "99+" : pendingCount}
                          </span>
                        )}
                      </div>
                      {item.hasSubmenu && (
                        <span className={`${active ? "text-white/80" : "text-gray-400 group-hover:text-green-700"} transition-colors`}>
                          {item.isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* Submenu - only show when expanded */}
                {!isCollapsed && item.hasSubmenu && item.isExpanded && (
                  <ul className="relative mt-1.5 ml-5 pl-3 space-y-1 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-px before:bg-gray-200">
                    {item.submenu.map((subItem) => {
                      // Map submenu IDs to group keys for badge display
                      const groupKey = groupKeyMap[subItem.id]
                      const pendingCount = Number(groupKey ? pendingApprovalByGroup[groupKey] || 0 : 0)
                      const hasPending = pendingCount > 0
                      const activeSubItem = currentPage === subItem.page

                      return (
                        <li key={subItem.id}>
                          <button
                            type="button"
                            className={`relative w-full min-h-9 px-2.5 py-1.5 rounded-lg cursor-pointer text-sm transition-all flex items-center justify-between gap-2 text-left ${
                              activeSubItem
                                ? "bg-green-50 text-green-700 font-semibold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                            onClick={subItem.onClick}
                          >
                            <span className="truncate">{subItem.label}</span>
                            {hasPending && (
                              <span className="shrink-0 min-w-5 h-5 px-1.5 bg-red-50 text-red-600 text-xs leading-5 rounded-full text-center font-semibold" title="Pending approval">
                                {pendingCount > 99 ? "99+" : pendingCount}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

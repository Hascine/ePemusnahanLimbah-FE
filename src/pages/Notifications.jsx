const Notifications = () => {
  const notifications = [
    {
      id: 1,
      title: "New Application Submitted",
      message: "Application APP-003 has been submitted for review",
      time: "2 hours ago",
      type: "info",
      read: false
    },
    {
      id: 2,
      title: "Application Approved",
      message: "Application APP-002 has been approved and ready for disposal",
      time: "1 day ago", 
      type: "success",
      read: true
    },
    {
      id: 3,
      title: "Disposal Completed",
      message: "Waste disposal for APP-001 has been completed",
      time: "3 days ago",
      type: "success",
      read: true
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-2 text-gray-600">Stay updated with your applications</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            <button className="text-sm text-green-600 hover:text-green-800">
              Mark all as read
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                  notification.type === 'success' ? 'bg-green-400' :
                  notification.type === 'warning' ? 'bg-yellow-400' :
                  'bg-green-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${
                      !notification.read ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Notifications

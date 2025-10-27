"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Header from "../components/Header"
import { LoadingButton } from "../components/LoadingSpinner"
import Alert from "../components/Alert"

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    delegatedAs: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: credentials, 2: delegation selection
  const [delegationOptions, setDelegationOptions] = useState([])
  const [credentialsVerified, setCredentialsVerified] = useState(false)

  const { login, checkCredentials, getDelegationOptions, error: authError, clearError, isAuthenticated } = useAuth()

  useEffect(() => {
    clearError()
  }, [clearError])

  useEffect(() => {
    if (authError) {
      setError(authError)
    }
  }, [authError])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (step === 1) {
        // Step 1: Check credentials and get delegation options
        const result = await checkCredentials(formData.username, formData.password)
        
        if (result.success) {
          setCredentialsVerified(true)
          
          // Check if delegation options are included in the credential check response
          if (result.data.delegationOptions && result.data.delegationOptions.length > 0) {
            // Use delegation options from credential check
            setDelegationOptions(result.data.delegationOptions)
            setStep(2)
          } else {
            // Try to get delegation options from dedicated endpoint
            const delegationResult = await getDelegationOptions(formData.username, formData.password)
            
            if (delegationResult.success && delegationResult.data.length > 0) {
              // User has delegation options, show step 2
              setDelegationOptions(delegationResult.data)
              setStep(2)
            } else {
              // No delegation options, proceed with direct login
              const loginResult = await login(formData.username, formData.password)
              if (loginResult.success) {
                window.history.replaceState({}, '', '/')
              } else {
                setError(loginResult.error || "Login failed")
              }
            }
          }
        } else {
          setError(result.error || "Invalid credentials")
        }
      } else if (step === 2) {
        // Step 2: Login with delegation selection
        const result = await login(
          formData.username,
          formData.password,
          formData.delegatedAs,
        )
        if (result.success) {
          window.history.replaceState({}, '', '/')
        } else {
          setError(result.error || "Login failed")
        }
      }
    } catch (err) {
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep(1)
    setDelegationOptions([])
    setCredentialsVerified(false)
    setFormData({
      ...formData,
      delegatedAs: ""
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header Component */}
      <Header />

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">
              <span className="text-green-600">e-Pemusnahan</span> Log In
            </h2>
          </div>

          {error && (
            <Alert 
              type="error" 
              message={error}
              onClose={() => setError("")}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* User Info Display */}
                <div className="bg-gray-50 p-4 rounded-md border">
                  <p className="text-sm text-gray-600">Logged in as: <span className="font-medium">{formData.username}</span></p>
                </div>

                {/* Delegation Selection */}
                <div>
                  <label htmlFor="delegatedAs" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Delegation (Optional)
                  </label>
                  <div className="relative">
                    <select
                      id="delegatedAs"
                      name="delegatedAs"
                      value={formData.delegatedAs}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm appearance-none bg-white pr-10"
                    >
                      <option value="">Continue without delegation</option>
                      {delegationOptions.map((option) => (
                        <option key={option.log_NIK} value={option.log_NIK}>
                          {option.log_NIK} - {option.Nama}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                  {delegationOptions.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      You have {delegationOptions.length} delegation option{delegationOptions.length > 1 ? 's' : ''} available.
                    </p>
                  )}
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Back to Login
                </button>
              </>
            )}

            {/* Period Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <div className="block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-gray-600 sm:text-sm">
                Agustus 2025
              </div>
            </div>

            {/* System Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System
              </label>
              <div className="block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-gray-600 sm:text-sm">
                e-Pemusnahan
              </div>
            </div>

            {/* Submit Button */}
            <LoadingButton
              type="submit"
              loading={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {step === 1 ? "Continue" : "Log in"}
            </LoadingButton>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

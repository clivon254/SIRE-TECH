import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from "../../utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AiOutlineArrowLeft } from "react-icons/ai"
import { ImSpinner2 } from "react-icons/im"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { MdCheckCircle } from "react-icons/md"
import * as yup from 'yup'

export default function ResetPassword() {

  const { token } = useParams()

  const navigate = useNavigate()
  
  const [form, setForm] = useState({ password: '', confirmPassword: '' })

  const [loading, setLoading] = useState(false)

  const [errors, setErrors] = useState({})

  const [touched, setTouched] = useState({})

  const [showPassword, setShowPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordReset, setPasswordReset] = useState(false)

  const [tokenValid, setTokenValid] = useState(true)

  const resetPasswordSchema = yup.object({
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
  })

  const handleChange = async (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    // Clear previous error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Validate field if it's been touched
    if (touched[name]) {
      try {
        await resetPasswordSchema.validateAt(name, { ...form, [name]: value })
      } catch (err) {
        setErrors(prev => ({ ...prev, [name]: err.message }))
      }
    }
    
  }

  const handleBlur = async (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    try {
      await resetPasswordSchema.validateAt(name, { ...form, [name]: value })
      setErrors(prev => ({ ...prev, [name]: '' }))
    } catch (err) {
      setErrors(prev => ({ ...prev, [name]: err.message }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({ password: true, confirmPassword: true })
    
    try {
      // Validate form
      await resetPasswordSchema.validate(form, { abortEarly: false })
      
      setLoading(true)
      const res = await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
        confirmPassword: form.confirmPassword
      })
      
      if (res.data.success) {
        setPasswordReset(true)
        toast.success("Password reset successfully!")
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        // Yup validation errors
        const validationErrors = {}
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message
        })
        setErrors(validationErrors)
      } else {
        // API errors
        const msg = err.response?.data?.message || "Failed to reset password"
        if (err.response?.status === 400) {
          // Token expired or invalid
          setTokenValid(false)
        }
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle invalid/expired token
  if (!tokenValid) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 py-8 px-2">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-red-600 hover:underline font-medium text-sm"
          >
            <AiOutlineArrowLeft size={18} />
            Back to Login
          </Link>
        </div>
        
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl rounded-xl bg-white shadow-lg p-6 md:p-10 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <MdCheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600">
              This password reset link is invalid or has expired.
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Please request a new password reset link.
            </p>
            
            <Link to="/forgot-password">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold">
                Request New Reset Link
              </Button>
            </Link>
            
            <Link
              to="/login"
              className="block text-sm text-red-600 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (passwordReset) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 py-8 px-2">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-red-600 hover:underline font-medium text-sm"
          >
            <AiOutlineArrowLeft size={18} />
            Back to Login
          </Link>
        </div>
        
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl rounded-xl bg-white shadow-lg p-6 md:p-10 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <MdCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Password Reset Successfully!
            </h2>
            <p className="text-gray-600">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Sign In Now
            </Button>
            
            <Link
              to="/forgot-password"
              className="block text-sm text-red-600 hover:underline"
            >
              Need another reset link?
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 py-8 px-2">
      {/* Back to Login Link */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mb-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-red-600 hover:underline font-medium text-sm"
        >
          <AiOutlineArrowLeft size={18} />
          Back to Login
        </Link>
      </div>
      
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl rounded-xl bg-white shadow-lg p-6 md:p-10">
        {/* Title and description */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
                className={`placeholder:text-xs pr-10 ${
                  touched.password && errors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : ''
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                tabIndex={-1}
              >
                {showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
                className={`placeholder:text-xs pr-10 ${
                  touched.confirmPassword && errors.confirmPassword 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : ''
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                tabIndex={-1}
              >
                {showConfirmPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold" 
            disabled={loading}
          >
            {loading ? (
              <>
                <ImSpinner2 className="animate-spin mr-2" size={18} />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>

          <div className="text-center space-y-2">
            <Link 
              to="/login" 
              className="block text-sm text-red-600 hover:underline"
            >
              Remember your password? Sign in
            </Link>
            <Link 
              to="/forgot-password" 
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              Need a new reset link?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
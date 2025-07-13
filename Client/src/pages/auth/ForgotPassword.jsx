import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from "../../utils/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { AiOutlineArrowLeft } from "react-icons/ai"
import { ImSpinner2 } from "react-icons/im"
import { MdEmail } from "react-icons/md"
import * as yup from 'yup'

export default function ForgotPassword() {

  const [email, setEmail] = useState('')

  const [loading, setLoading] = useState(false)

  const [errors, setErrors] = useState({})

  const [touched, setTouched] = useState({})

  const [emailSent, setEmailSent] = useState(false)

  const forgotPasswordSchema = yup.object({
    email: yup
      .string()
      .email('Please enter a valid email address')
      .required('Email is required'),
  })

  const handleChange = async (e) => {

    const { value } = e.target

    setEmail(value)
    
    // Clear previous error
    if (errors.email)
    {
      setErrors(prev => ({ ...prev, email: '' }))
    }
    
    // Validate field if it's been touched
    if (touched.email) 
    {

      try 
      {
        await forgotPasswordSchema.validateAt('email', { email: value })
      } 
      catch (err) 
      {
        setErrors(prev => ({ ...prev, email: err.message }))
      }

    }

  }

  const handleBlur = async (e) => {
    const { value } = e.target
    setTouched(prev => ({ ...prev, email: true }))
    
    try {
      await forgotPasswordSchema.validateAt('email', { email: value })
      setErrors(prev => ({ ...prev, email: '' }))
    } catch (err) {
      setErrors(prev => ({ ...prev, email: err.message }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark field as touched
    setTouched({ email: true })
    
    try {
      // Validate form
      await forgotPasswordSchema.validate({ email }, { abortEarly: false })
      
      setLoading(true)
      const res = await api.post('/auth/forgot-password', { email })
      
      if (res.data.success) {
        setEmailSent(true)
        toast.success("Reset link sent to your email!")
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
        const msg = err.response?.data?.message || "Failed to send reset email"
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
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
        
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl rounded-xl bg-white shadow-lg p-6 md:p-10 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <MdEmail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <Button
              onClick={() => {
                setEmailSent(false)
                setEmail('')
                setErrors({})
                setTouched({})
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Send Another Email
            </Button>
            
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
            Forgot Password?
          </h2>
          <p className="text-gray-600">
            No worries! Enter your email address and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={loading}
              autoComplete="email"
              className={`placeholder:text-xs ${
                touched.email && errors.email 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : ''
              }`}
            />
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
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
                Sending Reset Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>

          <div className="text-center">
            <Link 
              to="/login" 
              className="text-sm text-red-600 hover:underline"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
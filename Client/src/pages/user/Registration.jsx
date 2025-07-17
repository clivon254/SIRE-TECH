import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/store'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as yup from 'yup'
import api from "../../utils/api"
import { toast } from "sonner"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"

export default function Registration() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const { setToken } = useContext(StoreContext)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Yup schema
  const registrationSchema = yup.object({
    name: yup.string().required('Full name is required'),
    email: yup.string().email('Please enter a valid email address').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: yup.string()
      .oneOf([yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
  })

  // Handle input change
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
        await registrationSchema.validateAt(name, { ...form, [name]: value })
      } catch (err) {
        setErrors(prev => ({ ...prev, [name]: err.message }))
      }
    }
  }

  // Handle blur for validation
  const handleBlur = async (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))

    try {
      await registrationSchema.validateAt(name, { ...form, [name]: value })
      setErrors(prev => ({ ...prev, [name]: '' }))
    } catch (err) {
      setErrors(prev => ({ ...prev, [name]: err.message }))
    }
  }

  // Handle registration submit
  const handleRegistration = async (e) => {

    e.preventDefault()

    setTouched({ name: true, email: true, password: true })

    setLoading(true)

    try 
    {
      await registrationSchema.validate(form, { abortEarly: false })

      const res = await api.post('/auth/register', {
        username: form.name,
        email: form.email,
        password: form.password,
      })

      if (res.data.success) 
      {
        toast.success("Registration successful! Please log in.")

        navigate('/login')

      } 
      else 
      {
        toast.error(res.data.message || "Registration failed")
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
        const msg = err.response?.data?.message || "Registration failed"
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">

        <CardHeader>

          <CardTitle>Create Account</CardTitle>

          <CardDescription>
            Sign up for a new account
          </CardDescription>

        </CardHeader>

        <CardContent>

          <form onSubmit={handleRegistration} className="space-y-4">

            {/* username */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="username"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
                className={`placeholder:text-xs ${
                  touched.name && errors.name 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : ''
                }`}
              />
              {touched.name && errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
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
            
            {/* password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
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

            {/* confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            
          </form>

        </CardContent>
      </Card>
    </div>
  )
}
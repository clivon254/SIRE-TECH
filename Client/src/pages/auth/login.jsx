import { useState, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import api from "../../utils/api"
import { signInStart, signInSuccess, signInFailure } from '../../redux/user/userSlice'
import { StoreContext } from '../../context/store'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { toast } from "sonner";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { ImSpinner2 } from "react-icons/im";
import * as yup from 'yup'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { setToken } = useContext(StoreContext)
  const { loading, error } = useSelector(state => state.user)

  const loginSchema = yup.object({
    email: yup
      .string()
      .email('Please enter a valid email address')
      .required('Email is required'),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
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
        await loginSchema.validateAt(name, { ...form, [name]: value })
      } catch (err) {
        setErrors(prev => ({ ...prev, [name]: err.message }))
      }
    }
  }

  const handleBlur = async (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    try {
      await loginSchema.validateAt(name, { ...form, [name]: value })
      setErrors(prev => ({ ...prev, [name]: '' }))
    } catch (err) {
      setErrors(prev => ({ ...prev, [name]: err.message }))
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({ email: true, password: true })
    
    try {
      // Validate entire form
      await loginSchema.validate(form, { abortEarly: false })
      
      dispatch(signInStart())

      const res = await api.post('/auth/login', form)

      if (res.data.success) 
      {

        dispatch(signInSuccess(res.data.rest))

        if (rememberMe) 
        {
          localStorage.setItem("token", res.data.token)
        } 
        else 
        {
          sessionStorage.setItem("token", res.data.token)
        }

        setToken(res.data.token)

        toast.success("Login successful!")

        navigate('/dashboard')

      } 
      else 
      {
        dispatch(signInFailure(res.data.message))
      }

    } 
    catch (err) 
    {
      
      if (err.name === 'ValidationError') {
        // Yup validation errors
        const validationErrors = {}
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message
        })
        setErrors(validationErrors)
      } else {
        // API errors
        const msg = err.response?.data?.message || "Login failed"
        dispatch(signInFailure(msg))
      }

    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 py-8 px-2">
      {/* Back to Landing Page Link */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-red-600 hover:underline font-medium text-sm"
        >
          <AiOutlineArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl rounded-xl bg-white shadow-lg p-6 md:p-10">
       
        {/* Social login buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold shadow-sm"
            onClick={() => { /* TODO: Implement Google sign-in */ }}
          >
            <FcGoogle size={22} />
            <span>Sign in with Google</span>
          </Button>
          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-900 font-semibold shadow-sm"
            onClick={() => { /* TODO: Implement Apple sign-in */ }}
          >
            <FaApple size={22} />
            <span>Sign in with Apple</span>
          </Button>
        </div>

        {/* OR divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-70"></div>
          <span className="mx-4 text-lg font-bold text-gray-500 bg-white px-2 rounded-full shadow-sm">OR</span>
          <div className="flex-grow h-px bg-gradient-to-l from-blue-400 via-purple-400 to-pink-400 opacity-70"></div>
        </div>

        {/* Title and description */}
        <div className="mb-6">
          <h2 className="text-center text-xl md:text-3xl font-bold">Sign In to SIRE TECH</h2>
          <p className="text-center text-xs md:text-sm text-gray-500">Access your account securely and manage your business with ease</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@example.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={loading}
              autoComplete="username"
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
                autoComplete="current-password"
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
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="form-checkbox"
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-red-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={loading}>
            {loading ? (
              <>
                <ImSpinner2 className="animate-spin mr-2" size={18} />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
          {error && (
            <div className="text-red-600 text-center text-sm">{error}</div>
          )}
        </form>
        
      </div>

    </div>
  )
}
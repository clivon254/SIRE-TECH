import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom'
import { useContext } from 'react'
import { StoreContext } from './context/store'
import LandingPage from './pages/auth/LandingPage'
import Login from './pages/auth/login'
import Registration from './pages/auth/Registration'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import { toast } from "sonner";
import { Toaster } from "sonner";
import logo from "./assets/LOGO.png"; // Adjust the path if needed
import Header from "./components/common/Header"; // Adjust path if needed
import Sidebar from "./components/common/Sidebar"
import Invoice from "./pages/invoice/Invoice";
import Quatation from "./pages/quatation/quatation";
import Client from "./pages/client/Client";
import Project from "./pages/project/project";
import User from "./pages/user/User";
import Dashboard from "./pages/index/Dashboard";
import Profile from "./pages/user/Profile";


// Auth Layout - for public pages (no token required)
function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Outlet />
    </div>
  )
}

// Main Layout - for protected pages (token required)
function MainLayout() {

  const { setToken } = useContext(StoreContext)
  
  const handleLogout = () => {
    setToken("")
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-4">
          <Sidebar />
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </main>
      
    </div>
  )
}

// Protected Route Wrapper
function ProtectedRoute() {
  const { token } = useContext(StoreContext)
  
  if (!token) {
    return <Navigate to="/" replace />
  }
  
  return <Outlet />
}

// HomeRedirect for "/"
function HomeRedirect() {
  const { token } = useContext(StoreContext)
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  return <LandingPage />
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes - No token required */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>
        
        {/* Protected Routes - Token required */}
        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/quatation" element={<Quatation />} />
            <Route path="/client" element={<Client />} />
            <Route path="/project" element={<Project />} />
            <Route path="/user" element={<User />} />
          </Route>

        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors />
    </Router>
  )
}
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useContext } from 'react'
import { StoreContext } from './context/store'
import LandingPage from './pages/auth/LandingPage'
import Login from './pages/auth/login'
import Registration from './pages/user/Registration'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import OTP from "./pages/auth/OTP";
import { Toaster } from "sonner";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar"
import Invoice from "./pages/invoice/Invoice";
import Quatation from "./pages/quatation/quatation";
import Client from "./pages/client/Client";
import Project from "./pages/project/project";
import User from "./pages/user/User";
import Dashboard from "./pages/index/Dashboard";
import Profile from "./pages/user/Profile";
import UpdateUser from "./pages/user/UpdateUser";

// Main Layout - only for authenticated users
function Layout() {
  const { token } = useContext(StoreContext)
  return token ? (
    <div className="min-h-screen h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        <div className="flex-1 md:w-[70%] h-full overflow-y-auto relative">
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <Navigate to="/landing-page" replace />
  )
}


export default function App() {
  return (
    <Router>
      <Toaster richColors />
      <Routes>
        {/* Main authenticated layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/quatation" element={<Quatation />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/client" element={<Client />} />
          <Route path="/project" element={<Project />} />
          <Route path="/user" element={<User />} />
          <Route path="/update-user/:userId" element={<UpdateUser />} />
        </Route>

        {/* Public routes */}
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/otp" element={<OTP />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/landing-page" replace />} />
      </Routes>
    </Router>
  )
}
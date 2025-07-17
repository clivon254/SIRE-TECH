import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { StoreContext } from "../../context/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { FiUser, FiMail, FiImage, FiUserCheck, FiUserX, FiAlertTriangle } from "react-icons/fi";
import * as yup from "yup";
import api from "../../utils/api";
import { toast } from "sonner";

export default function UpdateUser() {
  const { userId } = useParams();
  const { token } = useContext(StoreContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    avatar: "",
    role: "Member",
    isAdmin: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Yup schema
  const updateSchema = yup.object({
    username: yup.string().required("Username is required"),
    email: yup.string().email("Please enter a valid email address").required("Email is required"),
    avatar: yup.string().url("Avatar must be a valid URL"),
    role: yup.string().required("Role is required"),
  });

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setFetchError("");
      try {
        const res = await api.get(`/user/get-user/${userId}`, {
          headers: { token },
        });
        if (res.data.success) {
          setForm({
            username: res.data.rest.username || "",
            email: res.data.rest.email || "",
            avatar: res.data.rest.avatar || "",
            role: res.data.rest.role || "Member",
            isAdmin: res.data.rest.isAdmin || false,
          });
        } else {
          setFetchError(res.data.message || "Failed to fetch user.");
        }
      } catch (err) {
        setFetchError(
          err?.response?.data?.message || "Failed to fetch user."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    // eslint-disable-next-line
  }, [userId, token]);

  // Handle input change
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear previous error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Validate field if it's been touched
    if (touched[name]) {
      try {
        await updateSchema.validateAt(name, { ...form, [name]: value });
      } catch (err) {
        setErrors((prev) => ({ ...prev, [name]: err.message }));
      }
    }
  };

  // Handle blur for validation
  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    try {
      await updateSchema.validateAt(name, { ...form, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: "" }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, [name]: err.message }));
    }
  };

  // Handle role change (from Select)
  const handleRoleChange = (val) => {
    setForm((prev) => ({
      ...prev,
      role: val,
      isAdmin: val === "Admin",
    }));
    setTouched((prev) => ({ ...prev, role: true }));
    setErrors((prev) => ({ ...prev, role: "" }));
  };

  // Handle submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, avatar: true, role: true });
    setSubmitting(true);
    try {
      await updateSchema.validate(form, { abortEarly: false });
      const res = await api.put(
        `/user/update-user/${userId}`,
        {
          username: form.username,
          email: form.email,
          avatar: form.avatar,
          role: form.role,
        },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("User updated successfully!");
        navigate("/user");
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      if (err.name === "ValidationError") {
        const validationErrors = {};
        err.inner.forEach((error) => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
      } else {
        toast.error(
          err?.response?.data?.message || "Update failed"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <FiUser className="animate-pulse text-gray-400" size={48} />
          <span className="text-gray-400 text-sm">Loading user...</span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-8 flex flex-col items-center shadow-sm max-w-md w-full">
          <FiAlertTriangle className="text-red-500 mb-3" size={40} />
          <div className="text-red-700 font-semibold text-lg mb-2">
            Failed to load user
          </div>
          <div className="text-red-500 text-sm mb-4 text-center">
            {fetchError}
          </div>
          <Button
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-100"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-md">
        <Link
          to="/user"
          className="inline-flex items-center gap-2 text-red-600 hover:underline font-medium text-sm mb-4"
        >
          <AiOutlineArrowLeft size={18} />
          Back to Users
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Update User</CardTitle>
            <CardDescription>Modify user details below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    disabled={submitting}
                    className={`placeholder:text-xs pl-10 ${
                      touched.username && errors.username
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {touched.username && errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    disabled={submitting}
                    className={`placeholder:text-xs pl-10 ${
                      touched.email && errors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {touched.email && errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              {/* Avatar */}
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <div className="relative">
                  <Input
                    id="avatar"
                    name="avatar"
                    type="url"
                    placeholder="Avatar URL"
                    value={form.avatar}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={submitting}
                    className={`placeholder:text-xs pl-10 ${
                      touched.avatar && errors.avatar
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {touched.avatar && errors.avatar && (
                  <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>
                )}
              </div>
              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={handleRoleChange}
                  disabled={submitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">
                      <span className="flex items-center gap-2">
                        <FiUserCheck /> Admin
                      </span>
                    </SelectItem>
                    <SelectItem value="Member">
                      <span className="flex items-center gap-2">
                        <FiUserX /> Member
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {touched.role && errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                disabled={submitting}
              >
                {submitting ? "Updating..." : "Update User"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
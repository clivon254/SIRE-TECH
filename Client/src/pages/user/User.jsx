import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { FiTrash2, FiEdit2, FiEye, FiAlertTriangle } from "react-icons/fi";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useContext, useState, useMemo } from "react";
import { StoreContext } from "@/context/store";
import { FiX } from "react-icons/fi";
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import Pagination from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FiSearch } from "react-icons/fi";

export default function User() {
  const navigate = useNavigate();
  const { User } = useSelector((state) => state.user);
  const { token } = useContext(StoreContext);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Search state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5); // default to 5 per page

  // Fetch users with React Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", token, page, limit],
    queryFn: async () => {
      const res = await api.get(`/user/get-users?page=${page}&limit=${limit}`, {
        headers: { token },
      });
      return res.data;
    },
    keepPreviousData: true, // for smooth pagination
  });

  // Filter users based on search input (case-insensitive)
  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data?.usersWithOutPassword || [];
    return (data?.usersWithOutPassword || []).filter(
      (user) =>
        user.username.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleOpenDeleteModal = async (userId) => {
    setSelectedUserId(userId);
    setShowDeleteModal(true);
    setLoadingUser(true);
    setDeleteError(null);
    try {
      const res = await api.get(`/user/get-user/${userId}`);
      if (res.data.success) {
        setSelectedUser(res.data.rest); // assuming backend returns {rest: user}
      } else {
        setDeleteError(res.data.message || "Failed to fetch user details.");
        setSelectedUser(null);
      }
    } catch (err) {
      setDeleteError("Failed to fetch user details.");
      setSelectedUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await api.delete(`/user/delete-user/${selectedUserId}`, {
        headers: { token },
      });
      if (res.data.success) {
        setShowDeleteModal(false);
        setSelectedUserId(null);
        setSelectedUser(null);
        window.location.reload(); // or refetch users if you re-add React Query mutation
      } else {
        setDeleteError(res.data.message || "Failed to delete user.");
      }
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || "Failed to delete user."
      );
    } finally {
      setDeleting(false);
    }
  };

  function getPageNumbers(current, total) {
    const delta = 2; // how many pages to show around current
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }

  return (

    <div className="p-4 md:p-8">

      {/* Header */}
      <div className="flex flex-row justify-between gap-4 mb-6">
            
        {/* Top: Search */}
        <div className="flex flex-col gap-1 flex-1">
         
          <div className="relative">
            {/* 
              Show icon if search is empty, or always on md+ screens.
              On mobile, hide icon when typing (search not empty).
            */}
            <span
              className={`
                absolute left-3 top-1/2 -translate-y-1/2 text-gray-400
                ${search.length > 0 ? "hidden md:block" : "block"}
              `}
            >
              <FiSearch />
            </span>
            <Input
              type="text"
              placeholder="search users by email/username"
              className={`
                pl-10  md:w-72 text-xs placeholder:text-xs
                border border-gray-700
                focus:border-red-600 focus:ring-0
              `}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
        </div>
          
        {/* Register new user link (admin only) */}
        {User?.isAdmin && (
          <Link
            to="/registration"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
          >
            Register New User
          </Link>
        )}

      </div>

  
      {/* Bottom: Actions and filters */}
      <div className="flex flex-row gap-2 items-center justify-between my-4">

        {/* total user */}
        <span className="text-xs text-gray-500 mt-1">
          Total {data?.usersWithOutPassword?.length ?? 0} users
        </span>

        {/* select */}
        <div className="flex flex-row gap-x-2">

          {/* status */}
          <Select
            // value={} onValueChange={} // implement status filter if needed
            disabled={isLoading}
            className=""
          >
            <SelectTrigger className="w-32 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

            {/* user per page */}
          <Select
            value={String(limit)}
            onValueChange={val => {
              setLimit(Number(val));
              setPage(1);
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-36 text-xs">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              {[1, 5, 10, 25, 50, 100, 1000].map(num => (
                <SelectItem key={num} value={String(num)}>
                  {num} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

      </div>


      {/* Loading and error states */}
      {isLoading && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Avatar</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(8)].map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="h-4 w-4 bg-gray-200 rounded animate-impulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-impulse mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-impulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-impulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-impulse" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <div className="h-4 w-6 bg-gray-200 rounded animate-impulse" />
                      <div className="h-4 w-6 bg-gray-200 rounded animate-impulse" />
                      <div className="h-4 w-6 bg-gray-200 rounded animate-impulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-50 border border-red-50 rounded-xl px-6 py-8 flex flex-col items-center shadow-sm max-w-md w-full">
            <FiAlertTriangle className="text-red-500 mb-3" size={40} />
            <div className="text-red-700 font-semibold text-lg mb-2">
              Failed to load users
            </div>
            <div className="text-red-500 text-sm mb-4 text-center">
              {error?.response?.data?.message || "An unexpected error occurred while fetching users. Please try again."}
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
      )}

      {/* Users Table */}
      {!isLoading && !isError && data && (
        <>
          <div className="overflow-x-auto rounded-lg border text-xs ">
            <Table>
              <TableHeader>
                <TableRow className="text-xs font-black">
                  <TableHead>#</TableHead>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No user found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <TableRow
                      key={user._id}
                      className={`${user.isAdmin ? "bg-red-50/75 hover:bg-red-50" : "hover:bg-gray-50"} text-xs `}
                    >
                      <TableCell>{idx + 1}.</TableCell>
                      <TableCell>
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="h-8 w-8 rounded-full object-cover border"
                        />
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isAdmin ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                            onClick={() => handleOpenDeleteModal(user._id)}
                          >
                            <FiTrash2 />
                          </Button>
                          <Link to={`/user/update/${user._id}`} title="Edit">
                            <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700">
                              <FiEdit2 />
                            </Button>
                          </Link>
                          <Link to={`/update-user/${user._id}`} title="View">
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                              <FiEye />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4 border border-red-100">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUserId(null);
                setSelectedUser(null);
                setDeleteError(null);
              }}
              aria-label="Close"
              disabled={deleting}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            {/* Warning Icon */}
            <div className="flex justify-center mb-3">
              <div className="bg-red-100 rounded-full p-3">
                <span className="text-red-600 text-3xl">
                  <FiAlertTriangle />
                </span>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2 text-center text-red-700 flex items-center justify-center gap-2">
              <FiTrash2 className="inline-block" /> Delete User
            </h2>
            {loadingUser ? (
              <div className="text-gray-500 text-center py-6 flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Loading user details...
              </div>
            ) : deleteError ? ( 
              <div className="text-red-500 text-center py-4">{deleteError}</div>
            ) : (
              <>
                <p className="text-center text-gray-700 mb-4 text-sm">
                  Are you sure you want to <span className="font-semibold text-red-700">delete</span> user <br />
                  <span className="font-semibold text-base mr-2">
                    {selectedUser?.username}
                  </span>
                  ?
                </p>
                <div className="flex justify-between gap-2 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUserId(null);
                      setSelectedUser(null);
                      setDeleteError(null);
                    }}
                    disabled={deleting}
                  >
                    <FiX className="text-lg" /> Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={handleDeleteUser}
                    disabled={deleting}
                  >
                    <FiTrash2 className="text-lg" />
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
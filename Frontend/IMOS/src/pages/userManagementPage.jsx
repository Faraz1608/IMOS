import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getUsers, updateUserRole } from '../services/userService';

const UserManagementPage = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers(token);
      setUsers(res.data);
    } catch (error) {
      toast.error("Could not fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole, token);
      toast.success("User role updated successfully.");
      // Update the role in the local state to reflect the change immediately
      setUsers(users.map(user => user._id === userId ? { ...user, role: newRole } : user));
    } catch (error) {
      toast.error("Failed to update user role.");
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="p-2 border rounded-md"
                  >
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;
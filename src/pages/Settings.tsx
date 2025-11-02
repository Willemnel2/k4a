import React, { useState, useEffect } from 'react';
import { Bell, Mail, Save, User, Lock, Users, Key, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';

const Settings = () => {
  const { user } = useAuth();
  const { users } = useData();
  const [fullName, setFullName] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [selectedUser, setSelectedUser] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [adminPasswordSuccess, setAdminPasswordSuccess] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      window.location.reload();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      setPasswordError(error.message || 'Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAdminPasswordReset = async () => {
    setAdminPasswordError('');
    setAdminPasswordSuccess(false);

    if (!selectedUser) {
      setAdminPasswordError('Please select a user');
      return;
    }

    if (!adminNewPassword || !adminConfirmPassword) {
      setAdminPasswordError('All password fields are required');
      return;
    }

    if (adminNewPassword.length < 6) {
      setAdminPasswordError('Password must be at least 6 characters');
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPasswordError('Passwords do not match');
      return;
    }

    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUser,
        { password: adminNewPassword }
      );

      if (error) throw error;

      setAdminPasswordSuccess(true);
      setSelectedUser('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      setTimeout(() => setAdminPasswordSuccess(false), 3000);
    } catch (error: any) {
      setAdminPasswordError(error.message || 'Error resetting password. Make sure you have admin privileges.');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your preferences and notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <User className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This name will be displayed in the system</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <input
                type="text"
                value={user?.role || 'user'}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 capitalize"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Bell className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Email Reminders</h3>
                <p className="text-sm text-gray-600">Receive email notifications for upcoming installations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Days Before Installation
              </label>
              <select
                value={reminderDays}
                onChange={(e) => setReminderDays(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={1}>1 day before</option>
                <option value={2}>2 days before</option>
                <option value={3}>3 days before</option>
                <option value={5}>5 days before</option>
                <option value={7}>1 week before</option>
              </select>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Lock className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700 text-sm">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm font-medium">Password changed successfully!</p>
              </div>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200"
            >
              {changingPassword ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Key className="w-5 h-5 mr-2" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin: User Password Reset */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Users className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Admin: Reset User Password</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Choose a user to reset password</option>
                {users.filter(u => u.id !== user?.id).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email} - {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="New password (min 6 characters)"
                  disabled={!selectedUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Confirm password"
                  disabled={!selectedUser}
                />
              </div>
            </div>

            {adminPasswordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700 text-sm">{adminPasswordError}</p>
              </div>
            )}

            {adminPasswordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm font-medium">User password reset successfully!</p>
              </div>
            )}

            <button
              onClick={handleAdminPasswordReset}
              disabled={resettingPassword || !selectedUser}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200"
            >
              {resettingPassword ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Reset User Password
                </>
              )}
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 text-sm">
                <strong>Warning:</strong> This will immediately change the user's password. They will need to use the new password to log in.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Mail className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Email Reminder Template</h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="text-sm text-gray-600 space-y-3">
            <p><strong>Subject:</strong> Installation Reminder - [Order Title]</p>
            <div className="border-t border-gray-300 pt-3">
              <p><strong>Dear [Client Name],</strong></p>
              <p className="mt-2">
                This is a friendly reminder that your installation for <strong>[Order Title]</strong> is scheduled for <strong>[Installation Date]</strong>.
              </p>
              <p className="mt-2">
                Please ensure someone is available at the scheduled time. If you need to reschedule, please contact us as soon as possible.
              </p>
              <p className="mt-2">
                Thank you for your business!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center transition-all duration-200 ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white disabled:bg-primary-400'
          }`}
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {saving ? 'Saving...' : saved ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
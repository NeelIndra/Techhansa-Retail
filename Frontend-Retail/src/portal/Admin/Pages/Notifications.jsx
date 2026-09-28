import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Clock, Send, Users, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../../context/AuthContext';
import { useContext } from 'react';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Broadcast Form State
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    roles: []
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const adminId = user?.userId || 'admin123';
      const response = await axios.get(`/api/notifications/${adminId}`);
      setNotifications(response.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const adminId = user?.userId || 'admin123';
      await axios.patch(`/api/notifications/${adminId}/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, unread: false } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const adminId = user?.userId || 'admin123';
      await axios.patch(`/api/notifications/${adminId}/read-all`);
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleRoleToggle = (role) => {
    setBroadcastData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.message || broadcastData.roles.length === 0) {
      return toast.error("Please fill all fields and select at least one recipient role.");
    }

    setIsBroadcasting(true);
    try {
      await axios.post('/api/notifications/broadcast', broadcastData);
      toast.success('Notification broadcasted successfully!');
      setBroadcastData({ title: '', message: '', roles: [] });
      setActiveTab('inbox');
    } catch (error) {
      toast.error('Failed to broadcast notification');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your alerts and broadcast messages</p>
          </div>
        </div>
        {activeTab === 'inbox' && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
          >
            <Check size={18} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'inbox'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Bell size={16} />
          Inbox
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'broadcast'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Megaphone size={16} />
          Broadcast
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        {activeTab === 'inbox' ? (
          loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Bell size={48} className="mb-4 text-slate-300 opacity-50" />
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((note, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={note._id}
                  className={`p-5 transition-colors ${note.unread ? 'bg-indigo-50/30 hover:bg-indigo-50/60' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-3 h-3 rounded-full mt-1 ${note.unread ? 'bg-indigo-500 shadow-sm shadow-indigo-300' : 'bg-transparent'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-4 mb-1">
                        <h4 className={`text-base font-semibold ${note.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {note.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                          <Clock size={14} />
                          {note.time}
                        </div>
                      </div>
                      <p className={`text-sm ${note.unread ? 'text-slate-700' : 'text-slate-500'}`}>
                        {note.message}
                      </p>
                      
                      {note.unread && (
                        <div className="mt-3">
                          <button
                            onClick={() => markAsRead(note._id)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-md transition-colors"
                          >
                            <Check size={14} /> Mark as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Megaphone size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Broadcast Notification</h2>
                <p className="text-slate-500 mt-2">Send important announcements to your partners across the platform.</p>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notification Title</label>
                  <input
                    type="text"
                    required
                    value={broadcastData.title}
                    onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                    placeholder="e.g., System Maintenance Update"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea
                    required
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                    rows="4"
                    placeholder="Enter the notification details here..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Select Recipients</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['franchise', 'channel'].map(role => (
                      <div 
                        key={role}
                        onClick={() => handleRoleToggle(role)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          broadcastData.roles.includes(role) 
                            ? 'border-indigo-600 bg-indigo-50/50' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                          broadcastData.roles.includes(role)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300'
                        }`}>
                          {broadcastData.roles.includes(role) && <Check size={14} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 capitalize">{role} Partners</p>
                          <p className="text-xs text-slate-500">Send to all {role}s</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all ${
                      isBroadcasting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5'
                    }`}
                  >
                    {isBroadcasting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Broadcasting...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Broadcast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

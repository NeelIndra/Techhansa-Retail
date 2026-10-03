import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Clock, Send, Users, Megaphone, Edit, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../../context/AuthContext';
import { useContext } from 'react';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    roles: [],
    poster: null
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [editingBroadcastId, setEditingBroadcastId] = useState(null);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const response = await axios.get('/api/notifications/broadcasts/history');
      setBroadcasts(response.data);
    } catch (error) {
      toast.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
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
    
    if (activeTab === 'new_banner') {
      if (!broadcastData.poster && !editingBroadcastId) {
        return toast.error("Please select a poster image to broadcast.");
      }
    } else {
      if (!broadcastData.title || !broadcastData.message || broadcastData.roles.length === 0) {
        return toast.error("Please fill all fields and select at least one recipient role.");
      }
    }

    setIsBroadcasting(true);
    try {
      const formData = new FormData();
      const rolesArray = activeTab === 'new_banner' ? ['website'] : broadcastData.roles;
      
      if (broadcastData.title) formData.append('title', broadcastData.title);
      if (broadcastData.message) formData.append('message', broadcastData.message);
      formData.append('roles', JSON.stringify(rolesArray));
      if (broadcastData.poster) {
        formData.append('poster', broadcastData.poster);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingBroadcastId) {
        await axios.put(`/api/notifications/broadcast/${editingBroadcastId}`, formData, config);
        toast.success('Broadcast updated successfully!');
      } else {
        await axios.post('/api/notifications/broadcast', formData, config);
        toast.success('Notification broadcasted successfully!');
      }
      setBroadcastData({ title: '', message: '', roles: [], poster: null });
      setEditingBroadcastId(null);
      setActiveTab('history');
      fetchBroadcasts();
    } catch (error) {
      toast.error('Failed to save broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleEdit = (broadcast) => {
    setBroadcastData({
      title: broadcast.title || '',
      message: broadcast.message || '',
      roles: broadcast.roles || [],
      poster: null
    });
    setEditingBroadcastId(broadcast._id);
    
    if (!broadcast.title && !broadcast.message && broadcast.roles.includes('website')) {
      setActiveTab('new_banner');
    } else {
      setActiveTab('new_broadcast');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      await axios.delete(`/api/notifications/broadcast/${id}`);
      toast.success('Broadcast deleted successfully');
      fetchBroadcasts();
    } catch (error) {
      toast.error('Failed to delete broadcast');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Broadcasts</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and view your broadcasted messages</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'history'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Clock size={16} />
          History
        </button>
        <button
          onClick={() => {
            setActiveTab('new_broadcast');
            if (!editingBroadcastId) {
              setBroadcastData({ title: '', message: '', roles: [], poster: null });
            }
          }}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'new_broadcast'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          {editingBroadcastId && activeTab === 'new_broadcast' ? <Edit size={16} /> : <Send size={16} />}
          {editingBroadcastId && activeTab === 'new_broadcast' ? 'Edit Broadcast' : 'New Broadcast'}
        </button>
        <button
          onClick={() => {
            setActiveTab('new_banner');
            if (!editingBroadcastId) {
              setBroadcastData({ title: '', message: '', roles: ['website'], poster: null });
            }
          }}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'new_banner'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ImageIcon size={16} />
          {editingBroadcastId && activeTab === 'new_banner' ? 'Edit Banner' : 'New Banner'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        {activeTab === 'history' ? (
          loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Megaphone size={48} className="mb-4 text-slate-300 opacity-50" />
              <p className="text-lg font-medium">No broadcasts yet</p>
              <p className="text-sm mt-1">You haven't sent any broadcasts.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {broadcasts.map((broadcast, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={broadcast._id}
                  className="p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Megaphone size={20} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-4 mb-1">
                        <h4 className="text-base font-semibold text-slate-800">
                          {broadcast.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                          <Clock size={14} />
                          {new Date(broadcast.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {broadcast.message}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {broadcast.roles.map((role, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md capitalize">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleEdit(broadcast)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(broadcast._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : activeTab === 'new_broadcast' ? (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Megaphone size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingBroadcastId ? 'Edit Broadcast' : 'Broadcast Notification'}
                </h2>
                <p className="text-slate-500 mt-2">
                  {editingBroadcastId 
                    ? 'Update the details of your broadcast message.' 
                    : 'Send important announcements to your partners across the platform.'}
                </p>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Poster Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBroadcastData({...broadcastData, poster: e.target.files[0]})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {editingBroadcastId && <p className="text-xs text-slate-500 mt-1">Upload a new image to replace the existing one.</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Select Recipients</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['franchise', 'channel', 'website'].map(role => (
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
                          <p className="font-semibold text-slate-800 capitalize">{role === 'website' ? 'Infra Website' : `${role} Partners`}</p>
                          <p className="text-xs text-slate-500">{role === 'website' ? 'Broadcast to public website visitors' : `Send to all ${role}s`}</p>
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
                        {editingBroadcastId ? 'Updating...' : 'Broadcasting...'}
                      </>
                    ) : (
                      <>
                        {editingBroadcastId ? <Edit size={18} /> : <Send size={18} />}
                        {editingBroadcastId ? 'Update Broadcast' : 'Send Broadcast'}
                      </>
                    )}
                  </button>
                  {editingBroadcastId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBroadcastId(null);
                        setBroadcastData({ title: '', message: '', roles: [], poster: null });
                        setActiveTab('history');
                      }}
                      className="ml-3 px-6 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingBroadcastId ? 'Edit Website Banner' : 'Post Website Banner'}
                </h2>
                <p className="text-slate-500 mt-2">
                  {editingBroadcastId 
                    ? 'Update the banner image displayed on the public website.' 
                    : 'Upload a new banner image to be displayed prominently on the public website.'}
                </p>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-6">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon size={32} />
                  </div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Upload Banner Image</label>
                  <p className="text-xs text-slate-500 mb-4">High-resolution landscape image recommended.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBroadcastData({...broadcastData, poster: e.target.files[0]})}
                    className="mx-auto block w-full max-w-xs text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer"
                  />
                  {editingBroadcastId && <p className="text-xs text-slate-500 mt-3">Upload a new image to replace the existing banner.</p>}
                  {broadcastData.poster && <p className="text-sm font-medium text-emerald-600 mt-3">Image selected: {broadcastData.poster.name}</p>}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all ${
                      isBroadcasting ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-200 hover:shadow-lg hover:shadow-pink-300 hover:-translate-y-0.5'
                    }`}
                  >
                    {isBroadcasting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {editingBroadcastId ? 'Updating...' : 'Publishing...'}
                      </>
                    ) : (
                      <>
                        {editingBroadcastId ? <Edit size={18} /> : <Send size={18} />}
                        {editingBroadcastId ? 'Update Banner' : 'Publish Banner'}
                      </>
                    )}
                  </button>
                  {editingBroadcastId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBroadcastId(null);
                        setBroadcastData({ title: '', message: '', roles: [], poster: null });
                        setActiveTab('history');
                      }}
                      className="ml-3 px-6 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

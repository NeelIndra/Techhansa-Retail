import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Search, 
  MessageSquare, 
  HelpCircle, 
  Settings,
  Menu
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import axios from '../../../api/axios';
import { Check } from 'lucide-react';

export default function Header({ toggleSidebar }) {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.userId) {
      axios.get(`/api/notifications/${user.userId}`)
        .then(res => setNotifications(res.data))
        .catch(err => console.error("Failed to fetch notifications", err));
    }
  }, [user?.userId]);

  const markAllAsRead = async () => {
    if (!user?.userId) return;
    try {
      await axios.patch(`/api/notifications/${user.userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const markAsRead = async (id) => {
    if (!user?.userId) return;
    try {
      await axios.patch(`/api/notifications/${user.userId}/${id}/read`);
      setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, unread: false } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu (Mobile Only) */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-xl"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg md:text-xl font-semibold text-slate-800 hidden sm:block">
          Welcome back, {user?.name || user?.userId || 'Partner'}
        </h2>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Bell size={20} />
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
          
          {isNotificationOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-800">Mark all as read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">No new notifications</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(note => (
                      <div key={note._id} className={`p-4 ${note.unread ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-semibold ${note.unread ? 'text-slate-800' : 'text-slate-600'}`}>{note.title}</h4>
                          <span className="text-xs text-slate-400">{note.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{note.message}</p>
                        {note.unread && (
                          <button onClick={() => markAsRead(note._id)} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            <Check size={12} /> Mark as read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative border-l border-slate-200 pl-6 flex items-center gap-2">
          <button onClick={() => navigate('/channel/profile')} className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors text-left">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-sm">{user?.name ? user.name.charAt(0) : 'C'}</span>
              )}
            </div>
            <div className="text-sm hidden md:block">
              <p className="font-semibold text-slate-700">{user?.name || 'Channel Partner'}</p>
              <p className="text-slate-500 text-xs">ID: {user?.userId}</p>
            </div>
          </button>
          
          <button onClick={() => navigate('/channel/settings')} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 hidden sm:block">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

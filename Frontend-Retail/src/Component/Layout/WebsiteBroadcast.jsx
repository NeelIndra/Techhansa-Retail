import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';

export default function WebsiteBroadcast() {
  const [broadcast, setBroadcast] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const response = await axios.get('/api/notifications/public/broadcast');
        if (response.data) {
          const dismissToken = `${response.data._id}-${response.data.title}`;
          const dismissedToken = sessionStorage.getItem('dismissedBroadcastToken');
          // Only show if we haven't dismissed this specific broadcast edit in this session
          if (dismissedToken !== dismissToken) {
            setBroadcast(response.data);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch public broadcast:', error);
      }
    };
    fetchBroadcast();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (broadcast) {
      const dismissToken = `${broadcast._id}-${broadcast.title}`;
      sessionStorage.setItem('dismissedBroadcastToken', dismissToken);
    }
  };

  if (!isVisible || !broadcast) return null;

  const hasText = broadcast.title || broadcast.message;
  const isPureBanner = broadcast.posterUrl && !hasText;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className={`relative rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
            isPureBanner 
              ? 'w-auto max-w-[95vw] bg-transparent' 
              : `w-full bg-white ${broadcast.posterUrl ? 'max-w-3xl' : 'max-w-md'}`
          }`}
        >
          <button
            onClick={handleDismiss}
            className={`absolute z-10 rounded-full p-2 transition-all shadow-sm backdrop-blur-md ${
              isPureBanner 
                ? 'top-3 right-3 text-white bg-black/40 hover:bg-black/60' 
                : 'top-4 right-4 text-gray-600 hover:text-gray-900 bg-white/90 hover:bg-white'
            }`}
          >
            <X size={20} />
          </button>
          
          {broadcast.posterUrl ? (
            <div className="flex flex-col w-full h-full">
              {isPureBanner ? (
                <img 
                  src={broadcast.posterUrl} 
                  alt="Broadcast Poster" 
                  className="w-auto h-auto max-w-[95vw] max-h-[85vh] object-contain rounded-2xl" 
                />
              ) : (
                <>
                  <div className="w-full h-56 sm:h-72 md:h-96 bg-slate-100 relative shrink-0">
                    <img 
                      src={broadcast.posterUrl} 
                      alt="Broadcast Poster" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="p-6 md:p-8 text-center bg-white relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2 hidden sm:flex">
                      <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Megaphone size={32} className="animate-pulse" />
                      </div>
                    </div>
                    
                    {broadcast.title && (
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 sm:mt-8">
                        {broadcast.title}
                      </h3>
                    )}
                    {broadcast.message && (
                      <p className="text-base md:text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                        {broadcast.message}
                      </p>
                    )}
                    
                    <button
                      onClick={handleDismiss}
                      className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      Continue to Website
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-6 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
              <div className="flex items-start gap-4 pt-2">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Megaphone size={24} className="animate-pulse" />
                </div>
                <div className="flex-1 pr-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    {broadcast.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {broadcast.message}
                  </p>
                  <button
                    onClick={handleDismiss}
                    className="mt-4 px-5 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

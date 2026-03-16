import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Send, Mail, MapPin, Phone, CheckCircle, Clock, Zap, MessageSquareQuote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footer } from '../components/Footer';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedType, setSelectedType] = useState('Bug Report');
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const feedbackTypes = ['Bug Report', 'Feature Request', 'Improvement', 'Other'];

  const typeColors: Record<string, string> = {
    'Bug Report': 'bg-red-50 text-red-600 border-red-200',
    'Feature Request': 'bg-purple-50 text-purple-600 border-purple-200',
    'Improvement': 'bg-teal-50 text-teal-600 border-teal-200',
    'Other': 'bg-amber-50 text-amber-600 border-amber-200',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ rating, selectedType, message });
    setIsSubmitted(true);
  };
  
  const resetForm = () => {
    setRating(0);
    setMessage('');
    setSelectedType('Bug Report');
    setIsSubmitted(false);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[260px]' : ''}`}>
        <div className="p-8 lg:p-12 flex-1 relative">
          <Header title="Feedback" onMenuClick={() => setIsSidebarOpen(true)} isSidebarOpen={isSidebarOpen} />

          <div className="w-full max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-black text-text-main tracking-tight">We'd love your Feedback</h1>
              <p className="text-text-muted mt-4 text-lg max-w-2xl mx-auto">
                We're constantly looking for ways to improve RegIntel. Whether you have a question, spotted a bug, or just want to share your experience, we want to hear from you!
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Column: Contact Information */}
              <div className="lg:col-span-3 flex flex-col gap-5">
                <div className="bg-white/50 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm mb-2">
                  <h3 className="font-bold text-text-main text-lg mb-1">Get in touch</h3>
                  <p className="text-sm text-text-muted">Direct channels to our team.</p>
                </div>

                <div onClick={() => window.open("https://mail.google.com/mail/?view=cm&fs=1&to=bdhanuka26@gmail.com", "_blank")} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer block">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="text-blue-600" size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Email Us</h3>
                    <p className="text-sm text-text-muted">bdhanuka26@gmail.com</p>
                  </div>
                </div>

                <div onClick={() => window.location.href = "tel:+919755588539"} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer block">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="text-purple-600" size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">Call Support</h3>
                    <p className="text-sm text-text-muted">+91-9755588539</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="text-teal-600" size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-main">Headquarters</h3>
                      <p className="text-sm text-text-muted">Christ University, Bangalore</p>
                      <a
                        href="https://maps.google.com/?q=12.9349,77.6050"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        12.9349° N, 77.6050° E
                      </a>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <iframe
                      title="Christ University Bangalore Map"
                      src="https://maps.google.com/maps?q=12.9349,77.6050&z=16&output=embed"
                      className="w-full h-52"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>

              {/* Middle Column: Feedback Form */}
              <div className="lg:col-span-6">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 shadow-xl shadow-black/5 min-h-[550px] relative overflow-hidden flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {!isSubmitted ? (
                      <motion.form 
                        key="form"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSubmit} 
                        className="flex flex-col gap-8"
                      >

                    {/* Rating Section with Emojis */}
                    <div className="text-center">
                      <label className="block text-base font-bold text-text-main mb-4">
                        How would you rate your experience?
                      </label>
                      <div className="flex justify-center gap-4">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoveredStar || rating);
                          return (
                            <button
                              key={star}
                              type="button"
                              className={`text-4xl transition-all duration-300 transform ${isFilled ? 'opacity-100 drop-shadow-xl scale-110 -translate-y-2' : 'opacity-30 grayscale hover:opacity-70 hover:scale-105'
                                }`}
                              onMouseEnter={() => setHoveredStar(star)}
                              onMouseLeave={() => setHoveredStar(0)}
                              onClick={() => setRating(star)}
                              title={`Rate ${star} out of 5`}
                            >
                              ⭐
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Feedback Type Selector */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-4 uppercase tracking-wider">Type of Feedback</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {feedbackTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedType(type)}
                            className={`px-3 py-3 rounded-xl text-sm font-bold border-2 transition-all shadow-sm flex items-center justify-center text-center ${selectedType === type
                              ? typeColors[type] + ' scale-105 z-10'
                              : 'bg-white text-text-muted border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-4 uppercase tracking-wider">Your Message</label>
                      <textarea
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind... Every detail helps us!"
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/80 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none placeholder:text-gray-400 text-base text-text-main leading-relaxed shadow-inner"
                        required
                      />
                    </div>

                      <div className="flex justify-center pt-2">
                        <button
                          type="submit"
                          className="w-full sm:w-2/3 px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:-translate-y-1"
                        >
                          Send Feedback <Send size={20} className="ml-1" />
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-center py-16"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: 0.1 
                        }}
                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 shadow-inner"
                      >
                        <CheckCircle className="w-12 h-12 text-green-600" />
                      </motion.div>
                      <h3 className="text-3xl font-black text-text-main mb-3">Brilliant!</h3>
                      <p className="text-text-muted mb-10 max-w-sm text-lg">
                        Your feedback has been successfully submitted. We deeply appreciate your time!
                      </p>
                      <button
                        onClick={resetForm}
                        className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-text-main font-bold text-sm rounded-xl transition-all hover:shadow-md"
                      >
                        Submit Another Response
                      </button>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column: FAQ & Extra Content */}
              <div className="lg:col-span-3 flex flex-col gap-5">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-full flex flex-col">
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <MessageSquareQuote className="text-primary" size={24} />
                    </div>
                    <h3 className="font-black text-text-main text-xl mb-3">Why your voice matters</h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      At RegIntel, we build our tools directly around the needs of compliance professionals. 
                      Your reports shape our roadmap, prioritize our bug-fixes, and ensure we're always hitting the mark.
                    </p>
                  </div>
                  
                  <div className="space-y-4 pt-6 border-t border-gray-100 mt-auto">
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-blue-600" size={16} />
                        <h4 className="font-bold text-text-main text-sm">Response Time</h4>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">We aim to review all feedback within 24-48 business hours.</p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-red-50/50 border border-red-100/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-red-600" size={16} />
                        <h4 className="font-bold text-text-main text-sm">Bug Reports</h4>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">Critical bugs are escalated instantly to our engineering team.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Feedback;
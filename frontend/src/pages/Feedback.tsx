import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { Send, Mail, MapPin, Phone, Menu } from 'lucide-react';
import { Footer } from '../components/Footer';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedType, setSelectedType] = useState('Bug Report');
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    alert("Thank you for your feedback!");
    setRating(0);
    setMessage('');
  };

  return (
    <div className="flex min-h-screen bg-background font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-h-screen">
        <div className="p-8 lg:p-12 flex-1">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-white border border-gray-200 rounded-lg text-text-muted hover:text-text-main shadow-sm mb-6"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-text-main">We'd love your Feedback</h1>
              <p className="text-text-muted mt-2 text-lg max-w-2xl">
                We're constantly looking for ways to improve RegIntel. Whether you have a question, spotted a bug, or just want to share your experience, we want to hear from you!
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20">
              {/* Left Column: Contact Information */}
              <div className="flex flex-col gap-6">

                <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-main">Email Us</h3>
                    <p className="text-sm text-text-muted">support@regintel.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-main">Call Support</h3>
                    <p className="text-sm text-text-muted">__</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-main">Headquarters</h3>
                    <p className="text-sm text-text-muted">Bangalore, India</p>
                  </div>
                </div>

              </div>

              {/* Right Column: Feedback Form */}
              <div>
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg shadow-black/5">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                    {/* Rating Section with Emojis */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-4">
                        How would you rate your experience?
                      </label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoveredStar || rating);
                          return (
                            <button
                              key={star}
                              type="button"
                              className={`text-3xl transition-all duration-200 hover:scale-125 focus:outline-none ${isFilled ? 'opacity-100 drop-shadow-md pb-2' : 'opacity-20 grayscale'
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
                      <label className="block text-sm font-bold text-text-main mb-4">Feedback Type</label>
                      <div className="flex flex-wrap gap-3">
                        {feedbackTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedType(type)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedType === type
                              ? typeColors[type] + ' shadow-sm'
                              : 'bg-white text-text-muted border-gray-200 hover:bg-gray-50'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-4">Your Message</label>
                      <textarea
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind... How can we help?"
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none placeholder:text-gray-400 text-sm text-text-main leading-relaxed"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto self-start mt-2 px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      Submit Feedback <Send size={16} className="ml-1" />
                    </button>
                  </form>
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
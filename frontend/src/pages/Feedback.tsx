import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { MessageSquare, Star, Send } from 'lucide-react';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedType, setSelectedType] = useState('Bug Report');
  const [message, setMessage] = useState('');

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
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-2xl font-bold text-text-main mb-7">Feedback</h1>

        <div className="max-w-xl">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-primary" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main">We'd love your feedback</h2>
                <p className="text-sm text-text-muted">Help us improve RegIntel for you.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-7">
                <label className="block text-sm font-medium text-text-main mb-3">
                  How would you rate your experience?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none transition-transform hover:scale-110"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${star <= (hoveredStar || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-gray-300'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-main mb-3">Feedback Type</label>
                <div className="flex flex-wrap gap-2.5">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedType === type
                        ? typeColors[type]
                        : 'bg-white text-text-muted border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-main mb-2">Your Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none placeholder:text-text-muted text-sm text-text-main"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold text-base rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Send size={16} /> Submit Feedback
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
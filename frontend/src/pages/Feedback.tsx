import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { MessageSquare, Star, Send } from 'lucide-react';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedType, setSelectedType] = useState('Bug Report');
  const [message, setMessage] = useState('');

  const feedbackTypes = ['Bug Report', 'Feature Request', 'Improvement', 'Other'];

  const typeColors: Record<string, string> = {
    'Bug Report': 'bg-accent-rose/15 text-accent-rose border-accent-rose/30',
    'Feature Request': 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
    'Improvement': 'bg-accent-teal/15 text-accent-teal border-accent-teal/30',
    'Other': 'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ rating, selectedType, message });
    alert("Thank you for your feedback!");
    setRating(0);
    setMessage('');
  };

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-8">
        <h1 className="text-2xl font-semibold text-white mb-7">Feedback</h1>

        <div className="max-w-xl">
          <div className="bg-dark-800/60 backdrop-blur-sm rounded-xl border border-dark-600/40 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-accent-purple/15 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-accent-purple" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">We'd love your feedback</h2>
                <p className="text-sm text-gray-500">Help us improve RegIntel for you.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-7">
                <label className="block text-sm font-medium text-gray-400 mb-3">
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
                          ? 'fill-accent-amber text-accent-amber'
                          : 'fill-transparent text-dark-500'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-3">Feedback Type</label>
                <div className="flex flex-wrap gap-2.5">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedType === type
                        ? typeColors[type]
                        : 'bg-dark-800 text-gray-500 border-dark-600/40 hover:bg-dark-700'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Your Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-4 py-3 rounded-lg border border-dark-600/40 bg-dark-700 focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/20 outline-none transition-all resize-none placeholder:text-gray-600 text-sm text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold text-base rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
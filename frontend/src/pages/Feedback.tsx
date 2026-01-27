import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { MessageSquare, Star, Send } from 'lucide-react';

const Feedback = () => {
  // State for form interactions
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedType, setSelectedType] = useState('Bug Report');
  const [message, setMessage] = useState('');

  const feedbackTypes = ['Bug Report', 'Feature Request', 'Improvement', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ rating, selectedType, message });
    alert("Thank you for your feedback!");
    // Reset form
    setRating(0);
    setMessage('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">Feedback</h1>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-orange-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">We'd Love Your Feedback</h2>
              <p className="text-slate-500">Help us improve RegIntel by sharing your thoughts and suggestions.</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Star Rating Section */}
              <div className="mb-8 text-center">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  How would you rate your experience?
                </label>
                <div className="flex justify-center gap-2">
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
                        size={32}
                        className={`${
                          star <= (hoveredStar || rating)
                            ? 'fill-orange-400 text-orange-400'
                            : 'fill-transparent text-gray-300'
                        } transition-colors duration-200`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Type Buttons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  What type of feedback is this?
                </label>
                <div className="flex flex-wrap gap-3">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedType === type
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none bg-slate-50 placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Submit Feedback
              </button>
            </form>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            Your feedback helps us build a better product. Thank you!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
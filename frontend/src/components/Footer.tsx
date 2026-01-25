
export const Footer = () => {
  return (
    <footer>
      {/* Dark Blue Stats Section (Compact) */}
      <div className="bg-slate-800 py-10 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Trusted by Leading Professionals</h2>
          <p className="text-blue-200 text-sm mb-8">Join thousands who rely on RegIntel.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-white">
            <div>
              <div className="text-2xl font-bold text-blue-400">10k+</div>
              <div className="text-blue-100 text-xs">Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">500+</div>
              <div className="text-blue-100 text-xs">Sources</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">99%</div>
              <div className="text-blue-100 text-xs">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">24/7</div>
              <div className="text-blue-100 text-xs">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links (Compact) */}
      <div className="bg-amber-50 py-6 px-6 border-t ">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">R</div>
             <span className="text-lg font-bold text-gray-900">RegIntel</span>
          </div>
          <div className="text-xs text-gray-500">
            © 2024 RegIntel. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
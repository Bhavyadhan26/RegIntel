

export const Footer = ({ showCTA = false }: { showCTA?: boolean }) => {
  return (
    <footer className="bg-gradient-to-b from-white to-slate-100 pt-4 pb-4 px-6 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        {/* CTA Section */}
        {showCTA && (
          <div className="bg-primary/100 rounded-3xl py-20 px-6 text-center shadow-2xl mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Ready to transform your regulatory workflow?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            </p>
            <p className="text-gray-400 text-lg text-white">Stop chasing regulations and start leading with the industry-standard intelligence platform.</p>
          </div>
        )}

        {/* Footer Links */}
        <div className="border-slate-200 flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/WEBLOGO.png" alt="RegIntel Logo" className="h-8 w-auto" />
            <span className="text-text-main font-bold">RegIntel</span>
          </div>

          <div>
            © 2026 RegIntel Intelligence Systems. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

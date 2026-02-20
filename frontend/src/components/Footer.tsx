

export const Footer = () => {
  return (
    <footer className="bg-white pt-10 pb-10 px-6 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* CTA Section */}
        <div className="bg-[#111827] rounded-3xl py-20 px-6 text-center shadow-2xl mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Ready to transform your regulatory workflow?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join hundreds of industry-leading firms that use RegIntel to stay ahead of the curve.
            Get started with your personalized demo today.
          </p>


        </div>

        {/* Footer Links */}
        <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-white text-[10px] font-bold">R</div>
            <span className="text-text-main font-bold">RegIntel</span>
          </div>

          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Contact Us</a>
          </div>

          <div>
            © 2024 RegIntel Intelligence Systems. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

const Footer = () => {
  return (
    <footer className="w-full bg-[#4f5d9b] text-white pt-12 pb-6 px-6 md:px-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
        
        {/* Brand */}
        <div>
          <h2 className="text-xl font-semibold mb-3">RegIntel</h2>
          <p className="text-gray-400 text-sm">
            Simplifying regulatory intelligence for professionals.
          </p>
        </div>

        {/* Product */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Product</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="hover:text-white cursor-pointer">Features</li>
            <li className="hover:text-white cursor-pointer">Publications</li>
            <li className="hover:text-white cursor-pointer">Alerts</li>
            <li className="hover:text-white cursor-pointer">Deadlines</li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Resources</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="hover:text-white cursor-pointer">About Us</li>
            <li className="hover:text-white cursor-pointer">Blog</li>
            <li className="hover:text-white cursor-pointer">FAQ</li>
            <li className="hover:text-white cursor-pointer">Support</li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="hover:text-white cursor-pointer">Terms & Conditions</li>
            <li className="hover:text-white cursor-pointer">Privacy Policy</li>
            <li className="hover:text-white cursor-pointer">Cookies</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} RegIntel. All rights reserved.</p>

        <div className="flex space-x-4 mt-2 md:mt-0">
          <span className="hover:text-white cursor-pointer">Twitter</span>
          <span className="hover:text-white cursor-pointer">LinkedIn</span>
          <span className="hover:text-white cursor-pointer">GitHub</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

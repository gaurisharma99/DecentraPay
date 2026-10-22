function Footer() {
  return (
    <footer className="bg-footer py-16 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-semibold text-white">DecentraPay</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-8">
            {['About', 'Documentation', 'GitHub', 'Discord'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-800 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>Building the future of peer-to-peer payments.</p>
          <p>© 2026 DecentraPay. Open source under MIT license.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

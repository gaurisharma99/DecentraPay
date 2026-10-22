import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenuAlt4, HiX } from 'react-icons/hi';
import { PaymentsContext } from '../context/PaymentsContext';
import { AuthContext } from '../context/AuthContext';
import { shortenAddress } from '../utils/helpers';

const navItems = ['About', 'Features', 'Pricing', 'Docs'];

const NavItem = ({ title, classProps = '' }) => (
  <li className={`cursor-pointer text-slate-300 hover:text-white transition-colors ${classProps}`}>
    {title}
  </li>
);

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentAccount, connectWallet } = useContext(PaymentsContext);
  const { logout } = useContext(AuthContext);

  return (
    <nav className="w-full flex justify-between items-center p-6 md:px-16">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">D</span>
        </div>
        <span className="text-xl font-semibold text-white">DecentraPay</span>
      </div>

      {/* Desktop Nav */}
      <ul className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <NavItem key={item} title={item} />
        ))}
        <li>
          {currentAccount ? (
            // Wallet connection status
            <span className="flex items-center gap-2 bg-[#18191f] border border-indigo-500/30 text-white px-5 py-2.5 rounded-full font-mono text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {shortenAddress(currentAccount)}
            </span>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2.5 rounded-full font-medium transition-all"
            >
              Connect Wallet
            </button>
          )}
        </li>
        <li>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </li>
      </ul>

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden text-white text-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <HiX /> : <HiMenuAlt4 />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 right-0 w-[70%] max-w-sm glass-blue z-50 p-6 md:hidden"
          >
            <button 
              className="absolute top-6 right-6 text-white text-2xl"
              onClick={() => setIsOpen(false)}
            >
              <HiX />
            </button>
            <ul className="flex flex-col gap-6 mt-16">
              {navItems.map((item) => (
                <NavItem key={item} title={item} classProps="text-lg" />
              ))}
              <li className="mt-4">
                {currentAccount ? (
                  <span className="flex items-center justify-center gap-2 bg-[#18191f] border border-indigo-500/30 text-white px-6 py-3 rounded-full font-mono text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    {shortenAddress(currentAccount)}
                  </span>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full font-medium"
                  >
                    Connect Wallet
                  </button>
                )}
              </li>
              <li className="mt-2">
                <button
                  onClick={logout}
                  className="w-full text-slate-400 hover:text-white transition-colors text-base"
                >
                  Logout
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;

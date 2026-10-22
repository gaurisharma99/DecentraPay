import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(username, password);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-3xl">D</span>
          </div>
          <h1 className="text-3xl font-bold text-white">DecentraPay</h1>
          <p className="text-slate-400 mt-2">Sign in to continue</p>
        </div>

        {/* Form */}
        <div className="glass-blue p-6">
          <form onSubmit={handleSubmit}>
            <label className="text-slate-300 text-sm">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter username"
              className="input-glass my-2"
              autoFocus
            />

            <label className="text-slate-300 text-sm mt-2 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter password"
                className="input-glass my-2 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {error && (
              <p className="text-rose-400 text-sm mt-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3 rounded-lg font-semibold transition-all"
            >
              <FiLogIn className="text-lg" />
              Login
            </button>
          </form>
        </div>

        {/* Demo credentials hint — so you don't have to keep looking them up.
            These are publicly-known throwaway test values (local Hardhat only). */}
        <div className="glass-white p-4 mt-6 text-xs text-slate-400 text-center leading-relaxed">
          <p className="text-slate-500 font-semibold tracking-wide">DEMO LOGIN</p>
          <p className="mt-1">
            Username: <code className="text-cyan-300 select-all">admin</code>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            Password: <code className="text-cyan-300 select-all">decentrapay2026</code>
          </p>
          <div className="h-px bg-slate-700 my-3" />
          <p className="text-slate-500 font-semibold tracking-wide">
            TEST WALLET (MetaMask → Import account)
          </p>
          <p className="mt-1 text-[10px] font-mono break-all text-slate-400 select-all">
            0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
          </p>
          <p className="text-slate-600 mt-2">
            Local Hardhat only — publicly known, never use on a real network.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;

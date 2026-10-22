import { useContext } from 'react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';
import { SiEthereum } from 'react-icons/si';
import { PaymentsContext } from '../context/PaymentsContext';
import { shortenAddress } from '../utils/helpers';
import Loader from './Loader';

const features = [
  { label: 'Instant', desc: 'Settlement' },
  { label: 'Global', desc: 'Reach' },
  { label: 'Low', desc: 'Fees' },
  { label: 'Secure', desc: 'Protocol' },
];

const InputField = ({ placeholder, name, type, value, onChange }) => (
  <input
    placeholder={placeholder}
    type={type}
    step="0.0001"
    value={value}
    onChange={(e) => onChange(e, name)}
    className="input-glass my-2"
  />
);

function Hero() {
  const {
    currentAccount,
    connectWallet,
    handleChange,
    sendPayment,
    formData,
    isLoading,
    isWrongNetwork,
    switchNetwork
  } = useContext(PaymentsContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { recipient, amount } = formData;
    if (!recipient || !amount) {
      alert('Please fill in recipient and amount');
      return;
    }
    sendPayment();
  };

  return (
    <div className="flex flex-col lg:flex-row justify-center items-start gap-12 px-6 md:px-16 py-16 max-w-7xl mx-auto">
      {/* Left Content */}
      <div className="flex-1 flex flex-col items-start">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold leading-tight"
        >
          <span className="text-gradient">Send Cryptocurrency</span>
          <br />
          <span className="text-white">Anywhere, Instantly</span>
        </motion.h1>
        
        <p className="text-slate-400 mt-6 text-lg max-w-md">
          Transfer ETH to anyone in the world with a single click. No intermediaries, 
          no delays—just peer-to-peer payments on the blockchain.
        </p>

        {!currentAccount && (
          <button
            onClick={connectWallet}
            className="mt-8 flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg shadow-indigo-500/25"
          >
            <FiSend className="text-xl" />
            Connect Wallet
          </button>
        )}

        {/* Feature Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 w-full max-w-lg">
          {features.map(({ label, desc }) => (
            <div key={label} className="glass-white p-4 text-center">
              <div className="text-white font-semibold">{label}</div>
              <div className="text-slate-400 text-sm">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content - Wallet Card & Form */}
      <div className="flex-1 w-full max-w-md">
        {/* Wallet Card */}
        <div className="eth-card p-6 h-44 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <SiEthereum className="text-white text-2xl" />
            </div>
            <span className="text-white/70 text-sm">Network</span>
          </div>
          <div>
            <p className="text-white/80 text-sm font-mono">
              {currentAccount ? shortenAddress(currentAccount) : 'Not connected'}
            </p>
            <p className="text-white text-xl font-semibold mt-1">
              {isWrongNetwork ? 'Wrong Network' : 'Hardhat Local'}
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <div className="glass-blue p-6 mt-6">
          <InputField 
            placeholder="Receiver Wallet Address (0x...)" 
            name="recipient" 
            type="text" 
            value={formData.recipient}
            onChange={handleChange} 
          />
          <InputField 
            placeholder="Amount (ETH)" 
            name="amount" 
            type="number" 
            value={formData.amount}
            onChange={handleChange} 
          />
          <InputField 
            placeholder="Message (optional)" 
            name="message" 
            type="text" 
            value={formData.message}
            onChange={handleChange} 
          />

          <div className="h-px bg-slate-700 my-4" />

          {isLoading ? (
            <Loader />
          ) : (
            <button
              onClick={isWrongNetwork ? switchNetwork : handleSubmit}
              disabled={!currentAccount}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all"
            >
              {!currentAccount
                ? 'Connect Wallet First'
                : isWrongNetwork
                  ? 'Switch to Hardhat Network'
                  : 'Send Payment'}
            </button>
          )}
          {currentAccount && isWrongNetwork && (
            <p className="text-rose-300 text-xs mt-3 text-center">
              You’re on the wrong network. Click above to switch MetaMask to Hardhat Local (31337).
            </p>
          )}
          {currentAccount && !isWrongNetwork && (
            <p className="text-slate-500 text-xs mt-3 text-center">
              One MetaMask confirmation — the smart contract validates, transfers, and records.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Hero;

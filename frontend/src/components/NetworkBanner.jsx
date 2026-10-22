import { useContext } from 'react';
import { FiAlertTriangle, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { PaymentsContext } from '../context/PaymentsContext';

// Small top-of-app banner that surfaces MetaMask problems instead of failing
// silently: wrong network (one-click switch), or no wallet at all (install link).
function NetworkBanner() {
  const { hasWallet, isWrongNetwork, switchNetwork } = useContext(PaymentsContext);

  if (hasWallet && !isWrongNetwork) return null;

  if (!hasWallet) {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <span className="flex items-center gap-2 text-amber-300 text-sm">
          <FiAlertTriangle /> MetaMask not detected — install it to use DecentraPay.
        </span>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-3 py-1 rounded-full text-xs font-medium transition-colors"
        >
          <FiDownload /> Get MetaMask
        </a>
      </div>
    );
  }

  return (
    <div className="bg-rose-500/15 border-b border-rose-500/30 px-6 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
      <span className="flex items-center gap-2 text-rose-300 text-sm">
        <FiAlertTriangle /> Wrong network — DecentraPay runs on Hardhat Local (chain 31337).
      </span>
      <button
        onClick={switchNetwork}
        className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1 rounded-full text-xs font-medium transition-colors"
      >
        <FiRefreshCw /> Switch network
      </button>
    </div>
  );
}

export default NetworkBanner;

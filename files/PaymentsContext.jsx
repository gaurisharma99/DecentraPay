import { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/constants';

export const PaymentsContext = createContext();

// Local Hardhat node network (must match backend/hardhat.config.js)
const HARDHAT_CHAIN_ID_HEX = '0x7a69'; // 31337
const HARDHAT_CHAIN_ID_DEC = 31337;
const HARDHAT_NETWORK = {
  chainId: HARDHAT_CHAIN_ID_HEX,
  chainName: 'Hardhat Local (localhost)',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['http://127.0.0.1:8545'],
};

const hasWallet = typeof window !== 'undefined' && !!window.ethereum;

// Auto-connect guard. Module-level (not component state) so React 18
// StrictMode's double-mounted effect in dev doesn't fire two MetaMask popups.
let autoConnectAttempted = false;

// ethers v6: getSigner() returns a Promise, so it must be awaited
// before constructing the Contract, otherwise every call fails with
// "contract runner does not support calling".
const getEthereumContract = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

export function PaymentsProvider({ children }) {
  const [currentAccount, setCurrentAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [formData, setFormData] = useState({ recipient: '', amount: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  const isWrongNetwork = chainId !== null && chainId !== HARDHAT_CHAIN_ID_DEC;

  const handleChange = (e, name) => {
    setFormData((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const fetchPayments = async () => {
    if (!window.ethereum) return;
    try {
      const contract = await getEthereumContract();
      const allPayments = await contract.fetchAllPayments();
      const structured = allPayments.map((p) => ({
        sender: p.sender,
        receiver: p.receiver,
        amount: ethers.formatEther(p.amount),
        message: p.message,
        timestamp: new Date(Number(p.timestamp) * 1000).toLocaleString(),
      }));
      setPayments(structured);
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  const checkWalletConnection = async () => {
    try {
      if (!window.ethereum) return;
      const [accounts, id] = await Promise.all([
        window.ethereum.request({ method: 'eth_accounts' }),
        window.ethereum.request({ method: 'eth_chainId' }),
      ]);
      setChainId(parseInt(id, 16));
      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        fetchPayments();
        return;
      }

      // No account authorised yet: open the MetaMask connect popup right away
      // on page load (once). If the user dismisses it, the "Connect" buttons
      // in the navbar/hero still work as a manual fallback.
      if (autoConnectAttempted) return;
      autoConnectAttempted = true;
      try {
        const granted = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (granted.length) {
          setCurrentAccount(granted[0]);
          fetchPayments();
        }
      } catch (reqErr) {
        // 4001 = user rejected, -32002 = a connect request is already pending.
        // Both are expected; stay disconnected and don't retry automatically.
        if (reqErr?.code !== 4001 && reqErr?.code !== -32002) {
          console.error('Auto-connect failed:', reqErr);
        }
      }
    } catch (err) {
      console.error('Wallet check failed:', err);
    }
  };

  // One-click add/switch to the local Hardhat network in MetaMask.
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
      });
      return true;
    } catch (err) {
      // 4902 = chain not added to MetaMask yet
      if (err?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HARDHAT_NETWORK],
          });
          return true;
        } catch (addErr) {
          console.error('Add network failed:', addErr);
          return false;
        }
      }
      // 4001 = user rejected
      if (err?.code !== 4001) console.error('Switch network failed:', err);
      return false;
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert('Please install MetaMask');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
      const id = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(id, 16));
      fetchPayments();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  // One transaction, one MetaMask confirmation: the smart contract itself
  // validates, executes the ETH transfer, and records the payment on-chain.
  const sendPayment = async () => {
    try {
      if (!window.ethereum) return alert('Please install MetaMask');

      // Guard: never send from the wrong network — offer a one-click switch.
      if (isWrongNetwork) {
        const switched = await switchNetwork();
        if (!switched) alert('Please switch MetaMask to the Hardhat Local network (chain 31337).');
        return;
      }

      const { recipient, amount, message } = formData;

      if (!ethers.isAddress(recipient)) {
        alert('Please enter a valid recipient address (0x...)');
        return;
      }
      if (!amount || Number(amount) <= 0) {
        alert('Please enter a valid ETH amount');
        return;
      }
      if (recipient.toLowerCase() === currentAccount.toLowerCase()) {
        alert('You cannot send a payment to yourself');
        return;
      }
      if (message.length > 256) {
        alert('Message must be 256 characters or fewer');
        return;
      }

      setIsLoading(true);
      const contract = await getEthereumContract();
      const parsedAmount = ethers.parseEther(amount);

      const tx = await contract.sendPayment(recipient, message, {
        value: parsedAmount,
      });
      await tx.wait();

      setFormData({ recipient: '', amount: '', message: '' });
      await fetchPayments();
    } catch (err) {
      console.error('Payment failed:', err);
      if (err?.code === 4001) {
        alert('Transaction rejected in wallet.');
      } else {
        alert('Payment failed. Check the console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    checkWalletConnection();

    // Keep the UI in sync when the user switches account or network in MetaMask.
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setCurrentAccount('');
        setPayments([]);
      } else {
        setCurrentAccount(accounts[0]);
        fetchPayments();
      }
    };
    const onChainChanged = (id) => {
      setChainId(parseInt(id, 16));
    };

    window.ethereum.on?.('accountsChanged', onAccountsChanged);
    window.ethereum.on?.('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', onChainChanged);
    };
  }, []);

  return (
    <PaymentsContext.Provider
      value={{
        currentAccount,
        connectWallet,
        formData,
        handleChange,
        sendPayment,
        isLoading,
        payments,
        fetchPayments,
        hasWallet,
        chainId,
        isWrongNetwork,
        switchNetwork,
        expectedChainId: HARDHAT_CHAIN_ID_DEC,
      }}
    >
      {children}
    </PaymentsContext.Provider>
  );
}

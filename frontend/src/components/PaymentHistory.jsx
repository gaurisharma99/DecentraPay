import { useContext } from 'react';
import { motion } from 'framer-motion';
import { PaymentsContext } from '../context/PaymentsContext';
import { shortenAddress } from '../utils/helpers';

const PaymentCard = ({ payment }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#18191f] m-4 p-5 rounded-2xl min-w-[280px] max-w-[340px] flex-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-shadow"
  >
    <div className="space-y-3 text-sm">
      {/* Local Hardhat network — no public block explorer for these addresses */}
      <p className="text-slate-400">From: {shortenAddress(payment.sender)}</p>
      <p className="text-slate-400">To: {shortenAddress(payment.receiver)}</p>
      <p className="text-white font-medium">{payment.amount} ETH</p>
      {payment.message && (
        <p className="text-slate-400 italic">"{payment.message}"</p>
      )}
    </div>
    
    <div className="bg-[#0a0a0f] px-4 py-2 rounded-full inline-block mt-4">
      <span className="text-cyan-400 text-sm font-medium">{payment.timestamp}</span>
    </div>
  </motion.div>
);

function PaymentHistory() {
  const { payments, currentAccount } = useContext(PaymentsContext);
  // No demo cards — show real on-chain payments only after a wallet connects
  const allPayments = currentAccount ? [...payments].reverse() : [];

  return (
    <section className="bg-transactions py-24 px-6 md:px-16">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {currentAccount ? 'Transaction History' : 'Connect to View History'}
        </h2>
        <p className="text-slate-400 mb-12">
          {currentAccount 
            ? 'Every transaction is permanently recorded on the blockchain' 
            : 'Link your wallet to see your transaction history'}
        </p>

        <div className="flex flex-wrap justify-center">
          {allPayments.length === 0 && (
            <p className="text-slate-500">
              {currentAccount ? 'No payments recorded yet.' : 'Connect your MetaMask wallet to get started.'}
            </p>
          )}
          {allPayments.map((payment, i) => (
            <PaymentCard key={i} payment={payment} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PaymentHistory;

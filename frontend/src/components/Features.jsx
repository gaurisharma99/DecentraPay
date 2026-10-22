import { motion } from 'framer-motion';
import { FiShield, FiZap, FiGlobe, FiLock } from 'react-icons/fi';

const features = [
  {
    icon: FiShield,
    title: 'Trustless Security',
    desc: 'Smart contracts handle your transfers. No middlemen, no counterparty risk.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: FiZap,
    title: 'Instant Settlement',
    desc: 'Transactions confirm in seconds. Your recipients get paid immediately.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: FiGlobe,
    title: 'Borderless Payments',
    desc: 'Send to any wallet address worldwide. Geography is irrelevant.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: FiLock,
    title: 'Non-Custodial',
    desc: 'Your keys, your crypto. We never hold or control your funds.',
    color: 'from-rose-500 to-orange-500',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function Features() {
  return (
    <section className="bg-features py-24 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gradient-accent">
            Why DecentraPay?
          </h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-lg">
            Built for the next generation of peer-to-peer payments on Ethereum.
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map(({ icon: Icon, title, desc, color }) => (
            <motion.div
              key={title}
              variants={item}
              className="glass-white p-6 hover:scale-[1.02] transition-transform cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                <Icon className="text-white text-xl" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">{title}</h3>
              <p className="text-slate-400">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Features;

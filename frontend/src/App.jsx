import { useContext } from 'react';
import { Navbar, Hero, Features, PaymentHistory, Footer, Login, NetworkBanner } from './components';
import { AuthContext } from './context/AuthContext';

function App() {
  const { isLoggedIn } = useContext(AuthContext);

  // Demo login gate — see utils/credentials.js (cosmetic only, not real auth).
  if (!isLoggedIn) return <Login />;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="bg-hero">
        <NetworkBanner />
        <Navbar />
        <Hero />
      </div>
      <Features />
      <PaymentHistory />
      <Footer />
    </div>
  );
}

export default App;

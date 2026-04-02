import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse } from 'lucide-react';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';
import Login from './Login';
import { supabase } from './lib/supabase'; // Initialize SDK to parse email hashes

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col items-center justify-between">
        
        {/* Navigation / Header Scaffold */}
        <header className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center z-10 relative">
          <Link to="/">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 font-bold text-2xl tracking-tighter"
            >
              <HeartPulse className="text-rose-500 w-8 h-8" />
              <span>Impact<span className="text-zinc-500">Play</span></span>
            </motion.div>
          </Link>
          
          <nav className="flex gap-6 text-sm font-medium text-zinc-400 items-center">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/login" className="bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-colors">Sign In</Link>
          </nav>
        </header>

        {/* Main Content Area */}
        <main className="w-full max-w-7xl mx-auto p-6 flex-1 flex flex-col justify-center items-center relative gap-8 z-10">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomeHero />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Ambient Background Glow (Emotion Driven) */}
        <div className="fixed top-1/2 left-1/2 -z-10 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[100px] pointer-events-none rounded-full bg-gradient-to-tr from-rose-500 via-zinc-900 to-indigo-500" />
      </div>
    </BrowserRouter>
  );
}

function HomeHero() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center max-w-3xl flex flex-col items-center gap-6"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-effect text-xs text-rose-300 mb-4 border-rose-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        New Month, New Impact
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
        Play with <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400">Purpose.</span>
      </h1>
      <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl">
        Transform your game into tangible global change. Your scores unlock rewards for you, and guaranteed impact for the charities you love.
      </p>
      
      <div className="mt-8 flex gap-4">
        <button className="bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
          Start Your Impact
        </button>
        <button className="px-8 py-4 rounded-full font-bold glass-effect hover:bg-white/10 transition-colors">
          View Current Pool
        </button>
      </div>
    </motion.div>
  );
}

function DashboardPlaceholder() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full glass-effect rounded-3xl p-8 max-w-4xl"
    >
      <h2 className="text-2xl font-bold mb-4">Subscriber Dashboard</h2>
      <p className="text-zinc-400">Subscription Status: <span className="text-rose-400">Inactive</span></p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-semibold mb-2">My Scores</h3>
          <p className="text-sm text-zinc-500">Enter your scores to participate in this month's draw.</p>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-semibold mb-2">Charity Impact</h3>
          <p className="text-sm text-zinc-500">Select your charity and adjust your contribution.</p>
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, DollarSign, Settings, Eye } from 'lucide-react';

export default function AdminPanel() {
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    // In live env this requests '/api/draws/simulate'
    setTimeout(() => {
      setSimulationResult({
        pool_size: 1500,
        rollover_applied: 450,
        jackpot_amount: 1050, // 40% + rollover
        match_4_amount: 525,  // 35%
        match_3_amount: 375,  // 25%
        winning_numbers: [4, 12, 18, 33, 41]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl flex gap-8"
    >
      <div className="w-1/4 flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-4">Command Center</h2>
        <button className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-indigo-500/30 text-indigo-400 font-semibold text-left transition-all hover:bg-zinc-800">
           <Activity className="w-5 h-5" /> Analytics
        </button>
        <button className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-400 text-left transition-all hover:bg-zinc-800 hover:text-white">
           <Eye className="w-5 h-5" /> Draw Simulation
        </button>
        <button className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-400 text-left transition-all hover:bg-zinc-800 hover:text-white">
           <Users className="w-5 h-5" /> User Overrides
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="glass-effect rounded-3xl p-6 border border-white/5">
            <h3 className="text-sm font-semibold text-zinc-500 mb-2">Total Active Users</h3>
             <span className="text-4xl font-black">2,410</span>
          </div>
          <div className="glass-effect rounded-3xl p-6 border border-white/5">
            <h3 className="text-sm font-semibold text-zinc-500 mb-2">Dynamic Pool Size</h3>
            <span className="text-4xl font-black text-rose-400">$12,050</span>
          </div>
          <div className="glass-effect rounded-3xl p-6 border border-white/5">
            <h3 className="text-sm font-semibold text-zinc-500 mb-2">Charity Distributed</h3>
             <span className="text-4xl font-black text-indigo-400">$2,410</span>
          </div>
        </div>

        <div className="glass-effect rounded-3xl p-8 border border-white/10 relative overflow-hidden flex-1 group">
           <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <h2 className="text-2xl font-bold mb-6">Draw Simulation Mode</h2>
           <p className="text-zinc-400 mb-8 max-w-xl">
             Run a mock draw to preview the current monthly pool size, verify the algorithm matching logic, and test jackpot rollovers before official publishing.
           </p>
           
           <button 
             onClick={handleSimulate}
             disabled={loading}
             className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
           >
             {loading ? 'Running Quantum Calculation...' : 'Simulate Monthly Draw'}
           </button>

           {simulationResult && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-8 p-6 bg-zinc-900/50 rounded-2xl border border-white/5"
             >
               <h3 className="text-xl font-bold mb-4">Simulation Results</h3>
               <div className="flex gap-4 mb-6">
                 {simulationResult.winning_numbers.map(n => (
                   <div key={n} className="w-12 h-12 rounded-full bg-white text-black font-black flex items-center justify-center text-xl shadow-lg">
                      {n}
                   </div>
                 ))}
               </div>
               
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="p-4 rounded-xl bg-black/40">
                   <span className="block text-zinc-500 mb-1">Total Pool</span>
                   <span className="font-mono text-lg">${simulationResult.pool_size}</span>
                 </div>
                 <div className="p-4 rounded-xl bg-black/40">
                   <span className="block text-zinc-500 mb-1">Previous Rollover</span>
                   <span className="font-mono text-lg text-yellow-500">+${simulationResult.rollover_applied}</span>
                 </div>
                 <div className="p-4 rounded-xl bg-black/40 border border-rose-500/20 col-span-2">
                   <span className="block text-rose-400 mb-1 font-bold">Jackpot (Match 5)</span>
                   <span className="font-mono text-2xl">${simulationResult.jackpot_amount}</span>
                 </div>
               </div>
             </motion.div>
           )}
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Medal, TrendingUp, Trophy, UploadCloud } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function Dashboard() {
  const [scores, setScores] = useState([]);
  const [newScore, setNewScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchScores(session.user.id);
    });
  }, []);

  const fetchScores = async (userId) => {
    const { data } = await supabase
      .from('scores')
      .select('score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setScores(data);
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!newScore || isNaN(newScore) || newScore < 1 || newScore > 45) return alert("Score must be between 1 and 45");
    setLoading(true);
    
    // Calls Express backend to handle logic
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session?.user?.id, score: Number(newScore) })
      });
      const data = await res.json();
      if (res.ok) {
        setNewScore('');
        if (session) fetchScores(session.user.id);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      // Ensure users upload to their own user_id directory
      const filePath = `${session?.user?.id || 'demo_user'}/proof_${Date.now()}.${fileExt}`;

      let { error: uploadError } = await supabase.storage
        .from('winner_proofs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;
      alert('Proof uploaded successfully! Admins will review it shortly.');
    } catch (error) {
       console.error("Upload missing keys or failed", error);
       alert('Upload feature requires initialized Supabase keys in local .env');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Overview Column */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="glass-effect rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Medal className="w-5 h-5 text-rose-400" /> 
            Subscription
          </h2>
          <p className="text-sm text-zinc-400 mb-4">Your current status unlocks rewards and impact.</p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active Match 5 Eligible
          </div>
        </div>

        <div className="glass-effect rounded-3xl p-6 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-indigo-400" /> 
            Charity Impact
          </h2>
          <p className="text-sm text-zinc-400 mb-4">You are converting your game to support <span className="text-white font-medium pl-1">Ocean Conservancy</span>.</p>
          
          <div className="w-full bg-zinc-900 rounded-full h-3 mb-2">
             <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '15%' }}></div>
          </div>
          <p className="text-xs text-zinc-500 flex justify-between">
            <span>Minimum 10% Contribution</span>
            <span className="text-indigo-400 font-bold">15% Active</span>
          </p>
        </div>

        {/* Winner Proof Upload Test Module */}
        <div className="glass-effect rounded-3xl p-6 relative overflow-hidden group">
           <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-yellow-400" /> 
            Verify Winnings
          </h2>
          <p className="text-sm text-zinc-400 mb-4">Upload a screenshot of your Golf Platform score logs to verify your Jackpot.</p>
          
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-2xl cursor-pointer hover:bg-zinc-800/50 transition-colors relative">
             <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 text-zinc-500 mb-2" />
                <p className="text-sm text-zinc-400">{uploading ? 'Uploading...' : 'Click to upload screenshot'}</p>
             </div>
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Main Scores & Draw Action */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glass-effect rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px]" />
          
          <div className="flex justify-between items-center mb-8 relative z-10">
             <div>
               <h2 className="text-2xl font-bold tracking-tight">Your Action Pool</h2>
               <p className="text-zinc-400 text-sm mt-1">Rolling 5-Score Interface. New entries replace the oldest.</p>
             </div>
             <Trophy className="w-8 h-8 text-rose-400" />
          </div>

          <form onSubmit={handleScoreSubmit} className="flex gap-4 mb-10 relative z-10">
            <input 
              type="number"
              min="1" max="45"
              placeholder="Enter Stableford (1-45)"
              className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-rose-500/50 transition-colors text-lg"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Score'}
            </button>
          </form>

          <div className="space-y-3 relative z-10">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex justify-between">
              <span>Latest Entries</span>
              <span className="text-rose-400">{scores.length}/5</span>
            </h3>
            
            {scores.length === 0 ? (
              <p className="text-center text-zinc-600 py-8">No scores entered yet this month.</p>
            ) : (
              scores.map((s, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex justify-between items-center p-4 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-rose-400 font-mono font-bold text-xl w-6">#{idx + 1}</span>
                    <span className="text-zinc-400 text-sm">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="font-bold text-2xl">{s.score}</span>
                </motion.div>
              ))
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}

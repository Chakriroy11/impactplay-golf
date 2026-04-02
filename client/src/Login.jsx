import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link! (Or if email confirmations are disabled, try signing in now.)');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md glass-effect rounded-3xl p-8 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="text-center mb-8 relative z-10">
        <HeartPulse className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
        <p className="text-zinc-400 mt-2">
          {isSignUp ? 'Start making an impact today.' : 'Sign in to authorize your dashboard.'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="flex flex-col gap-4 relative z-10">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500/50 transition-colors"
            placeholder="Email Address"
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500/50 transition-colors"
            placeholder="Password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-400 relative z-10">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-indigo-400 font-semibold hover:underline"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </motion.div>
  );
}

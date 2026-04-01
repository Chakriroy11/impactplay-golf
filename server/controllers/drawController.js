const { supabase } = require('../lib/supabase');

// Constants for Distribution Map
const DISTRIBUTION_PERCENTAGES = {
  5: 0.40, // 40%
  4: 0.35, // 35%
  3: 0.25  // 25%
};

// Generates 5 unique numbers between 1 and 45.
function generateWinningNumbers() {
  const numbers = new Set();
  while (numbers.size < 5) {
    const randomNum = Math.floor(Math.random() * 45) + 1;
    numbers.add(randomNum);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

// SIMULATE A DRAW
// Calculates dynamic pool size based on active subscriptions, applies any rollovers from last month, matches user entries, calculates returns.
async function simulateDraw(req, res) {
  try {
    // 1. Fetch Active Subscribers
    const { count: activeSubs, error: subsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active');
      
    if (subsError) throw subsError;

    // 1.1 Calculate basic monthly pool (Assume $PRIZE_CONTRIBUTION_AMOUNT = $5 for math purposes, or fetch from env)
    const prizeContribution = parseFloat(process.env.PRIZE_CONTRIBUTION_AMOUNT || '5.00');
    let poolSize = (activeSubs || 0) * prizeContribution;

    // 2. Fetch the most recent completed draw to check for Jackpot Rollovers
    const { data: previousDraws, error: prevDrawErr } = await supabase
      .from('draws')
      .select('status, id, draw_month_year')
      .eq('status', 'published')
      .order('draw_month_year', { ascending: false })
      .limit(1);

    if (prevDrawErr) throw prevDrawErr;
    
    let rolloverAmount = 0;
    
    // Check if the previous draw had NO 5-number match
    if (previousDraws && previousDraws.length > 0) {
      const prevDrawId = previousDraws[0].id;
      const { count: match5Count, error: match5Err } = await supabase
        .from('winnings')
        .select('*', { count: 'exact', head: true })
        .eq('draw_id', prevDrawId)
        .eq('match_tier', 5);
        
      if (match5Err) throw match5Err;
      
      // If no one won the 5-match jackpot last time, we fetch the last jackpot amount and roll it over.
      if (match5Count === 0) {
        const { data: previousDrawDetails } = await supabase
          .from('draws')
          .select('jackpot_amount')
          .eq('id', prevDrawId)
          .single();
        rolloverAmount = previousDrawDetails?.jackpot_amount || 0;
      }
    }

    // 3. Pool Allocations including Rollover
    // Note: Usually rollover ONLY goes to the Jackpot.
    let baseJackpot = poolSize * DISTRIBUTION_PERCENTAGES[5];
    let finalJackpot = baseJackpot + Number(rolloverAmount);
    
    const allocations = {
      pool_size: poolSize,
      rollover_applied: Number(rolloverAmount),
      jackpot_amount: finalJackpot,
      match_4_amount: poolSize * DISTRIBUTION_PERCENTAGES[4],
      match_3_amount: poolSize * DISTRIBUTION_PERCENTAGES[3]
    };

    // 4. Generate winning numbers
    const winningNumbers = generateWinningNumbers();

    // 5. Save Simulation to Database
    const drawDateDate = new Date();
    // Use first day of the current month as an identifier
    const monthYear = new Date(drawDateDate.getFullYear(), drawDateDate.getMonth(), 1).toISOString();

    const { data: simulationEntry, error: insertError } = await supabase
      .from('draws')
      .insert([{
        draw_month_year: monthYear,
        winning_numbers: winningNumbers,
        pool_size: poolSize,
        jackpot_amount: allocations.jackpot_amount,
        match_4_amount: allocations.match_4_amount,
        match_3_amount: allocations.match_3_amount,
        status: 'simulated'
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // TODO: In a real simulation, we'd also cross-reference all user scores right now and see who "would" win. 
    // Usually simulation is just to see numbers and pool size before finalizing.

    return res.status(200).json({ 
      message: 'Simulation completely successfully', 
      draw: simulationEntry,
      breakdown: allocations
    });

  } catch (err) {
    console.error('Error simulating draw:', err);
    return res.status(500).json({ error: 'Internal server error simulating draw' });
  }
}

// FINALIZES A DRAW and calculates all winners
async function publishDraw(req, res) {
  // Logic to actually change status to 'published' and insert all winning users into the `winnings` table.
}

module.exports = {
  simulateDraw,
  publishDraw
};

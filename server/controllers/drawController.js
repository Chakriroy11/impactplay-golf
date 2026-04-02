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
  try {
    // 1. Get the latest simulated draw
    const { data: draws, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'simulated')
      .order('created_at', { ascending: false })
      .limit(1);

    if (drawError || !draws || draws.length === 0) {
      return res.status(400).json({ error: 'No simulated draw found to publish' });
    }
    const draw = draws[0];
    const winningNumbersSet = new Set(draw.winning_numbers);

    // 2. Fetch all active subscribers
    const { data: activeUsers, error: usersErr } = await supabase
      .from('users')
      .select('id')
      .eq('subscription_status', 'active');
      
    if (usersErr) throw usersErr;
    const activeUserIds = new Set(activeUsers.map(u => u.id));

    // 3. Fetch all scores and find top 5 for each active user
    const { data: allScores, error: scoresErr } = await supabase
      .from('scores')
      .select('user_id, score')
      .order('created_at', { ascending: false });

    if (scoresErr) throw scoresErr;

    const userLatestScores = {};
    for (const s of allScores) {
      if (!activeUserIds.has(s.user_id)) continue;
      if (!userLatestScores[s.user_id]) userLatestScores[s.user_id] = [];
      if (userLatestScores[s.user_id].length < 5) {
        userLatestScores[s.user_id].push(s.score);
      }
    }

    // 4. Calculate matches
    const tier5Winners = [];
    const tier4Winners = [];
    const tier3Winners = [];

    for (const [userId, scores] of Object.entries(userLatestScores)) {
      let matchCount = 0;
      for (const score of scores) {
        if (winningNumbersSet.has(score)) matchCount++;
      }
      
      if (matchCount === 5) tier5Winners.push(userId);
      else if (matchCount === 4) tier4Winners.push(userId);
      else if (matchCount === 3) tier3Winners.push(userId);
    }

    // 5. Calculate payout per winner
    const match5Payout = tier5Winners.length > 0 ? (draw.jackpot_amount / tier5Winners.length) : 0;
    const match4Payout = tier4Winners.length > 0 ? (draw.match_4_amount / tier4Winners.length) : 0;
    const match3Payout = tier3Winners.length > 0 ? (draw.match_3_amount / tier3Winners.length) : 0;

    // 6. Generate winnings rows
    const winningsToInsert = [];
    tier5Winners.forEach(id => winningsToInsert.push({ draw_id: draw.id, user_id: id, match_tier: 5, amount_won: match5Payout }));
    tier4Winners.forEach(id => winningsToInsert.push({ draw_id: draw.id, user_id: id, match_tier: 4, amount_won: match4Payout }));
    tier3Winners.forEach(id => winningsToInsert.push({ draw_id: draw.id, user_id: id, match_tier: 3, amount_won: match3Payout }));

    // 7. Save strictly in Database
    if (winningsToInsert.length > 0) {
      const { error: winErr } = await supabase.from('winnings').insert(winningsToInsert);
      if (winErr) throw winErr;
    }

    // 8. Change draw status to published
    const { error: updateErr } = await supabase
      .from('draws')
      .update({ status: 'published' })
      .eq('id', draw.id);
      
    if (updateErr) throw updateErr;

    return res.status(200).json({ 
      message: 'Draw published successfully', 
      stats: {
        match5_winners: tier5Winners.length,
        match4_winners: tier4Winners.length,
        match3_winners: tier3Winners.length
      }
    });

  } catch (err) {
    console.error('Error publishing draw:', err);
    return res.status(500).json({ error: 'Internal server error while publishing' });
  }
}

module.exports = {
  simulateDraw,
  publishDraw
};

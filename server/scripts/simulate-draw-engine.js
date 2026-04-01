require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) 
    : null;

const SIMULATION_CONFIG = {
  NUM_USERS: 100,
  SCORES_PER_USER: 5,
  POOL_CONTRIBUTION_PER_USER: 10,  // $10 logic base
  DISTRIBUTIONS: { 5: 0.40, 4: 0.35, 3: 0.25 }
};

// Generates an array of n random unique numbers between 1 and 45 constraint
function generateDrawArray(count = 5) {
  const nums = new Set();
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

// Compare user numbers with winning numbers
function getMatchCount(userNumbers, winningNumbers) {
  return userNumbers.filter(n => winningNumbers.includes(n)).length;
}

async function runSimulation() {
  console.log(`--- [ QUANTUM DRAW SIMULATION INITIATED ] ---`);
  
  // 1. MOCK 100 USERS IN MEMORY
  const mockUsers = [];
  for (let i = 0; i < SIMULATION_CONFIG.NUM_USERS; i++) {
    mockUsers.push({
      email: `sim_user_${i}@example.com`,
      id: `uuid-sim-${i}`,
      scores: generateDrawArray(SIMULATION_CONFIG.SCORES_PER_USER) // Their 5 latest scores
    });
  }
  console.log(`[+] Placed ${SIMULATION_CONFIG.NUM_USERS} Active Subscribers into Memory.`);

  // 2. MATHEMATICAL POOL SETUP
  const totalPool = mockUsers.length * SIMULATION_CONFIG.POOL_CONTRIBUTION_PER_USER;
  const jackpot = totalPool * SIMULATION_CONFIG.DISTRIBUTIONS['5'];
  const match4 = totalPool * SIMULATION_CONFIG.DISTRIBUTIONS['4'];
  const match3 = totalPool * SIMULATION_CONFIG.DISTRIBUTIONS['3'];

  console.log(`[+] Total Dynamic Pool Size: $${totalPool.toLocaleString()}`);
  console.log(`    -> Match 5 Jackpot (40%): $${jackpot.toLocaleString()}`);
  console.log(`    -> Match 4 Sub-Prize (35%): $${match4.toLocaleString()}`);
  console.log(`    -> Match 3 Entry-Prize (25%): $${match3.toLocaleString()}`);

  // 3. GENERATE WINNING NUMBERS
  const winningNumbers = generateDrawArray(5);
  console.log(`\n[🌟] OFFICIAL WINNING DRAW: [ ${winningNumbers.join(', ')} ]\n`);

  // 4. CROSS-REFERENCE WINNERS
  const winners = { 5: [], 4: [], 3: [] };

  mockUsers.forEach(user => {
    const matches = getMatchCount(user.scores, winningNumbers);
    if (matches >= 3 && matches <= 5) {
      winners[matches].push(user);
    }
  });

  console.log(`--- [ SIMULATION RESULTS ] ---`);
  console.log(`Match 5 Winners (Rollover check): ${winners['5'].length}`);
  console.log(`Match 4 Winners: ${winners['4'].length} (Each receives $${winners['4'].length > 0 ? (match4 / winners['4'].length).toFixed(2) : match4})`);
  console.log(`Match 3 Winners: ${winners['3'].length} (Each receives $${winners['3'].length > 0 ? (match3 / winners['3'].length).toFixed(2) : match3})\n`);

  if (winners['5'].length === 0) {
    console.log(`[❗] NO MATCH 5 JACKPOT WINNER. $${jackpot} ROLLS OVER TO NEXT MONTH.`);
  }

  // 5. INSERT DATABASE RECORD SO FRONTEND HAS HISTORICAL DATA
  if (supabase) {
    try {
      console.log('Inserting [PUBLISHED] Demo record into Supabase for Historical Charting...');
      const { data, error } = await supabase.from('draws').insert([{
        draw_month_year: new Date().toISOString(),
        winning_numbers: winningNumbers,
        pool_size: totalPool,
        jackpot_amount: jackpot,
        match_4_amount: match4,
        match_3_amount: match3,
        status: 'published'
      }]);
      
      if (error) throw error;
      console.log(`[✅] Successfully inserted Published Draw Mock into Supabase.`);
    } catch (err) {
      console.log(`[❌] Could not insert mock draw into DB (Likely keys missing during Simulation): ${err.message}`);
    }
  } else {
    console.log('[⚠️] Supabase keys not found in .env, skipping historical DB insertion.');
  }
}

runSimulation();

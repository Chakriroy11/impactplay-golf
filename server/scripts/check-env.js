require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function validateEnv() {
  console.log('--- PRE-FLIGHT ENVIRONMENT CHECK ---');
  let hasErrors = false;

  const requiredKeys = [
    'STRIPE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'PRIZE_CONTRIBUTION_AMOUNT'
  ];

  requiredKeys.forEach(key => {
    if (!process.env[key]) {
      console.error(`[❌] Missing Required ENV Key: ${key}`);
      hasErrors = true;
    } else {
      console.log(`[✅] Found: ${key}`);
    }
  });

  if (hasErrors) {
    console.error('\nEnvironment validation failed. Please populate your .env file with the required keys.');
    process.exit(1);
  }

  // Check Supabase Connectivity
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from('charities').select('id').limit(1);
    
    if (error && error.code !== '42P01') { 
      // 42P01 is relation does not exist, meaning connected but table missing
      console.error(`[❌] Supabase Connectivity Error: ${error.message}`);
      process.exit(1);
    }
    console.log('[✅] Supabase Connection Verified');
  } catch (err) {
    console.error(`[❌] Supabase Connection Crash: ${err.message}`);
    process.exit(1);
  }

  console.log('--- ALL CHECKS PASSED. STARTING SERVER... ---\n');
}

validateEnv();

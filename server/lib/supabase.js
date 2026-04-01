const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Use the service role key on the backend to bypass RLS when performing admin actions or webhooks
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };

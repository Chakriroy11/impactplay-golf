const { supabase } = require('../lib/supabase');

// Adds a new score for a user and ensures they only have the latest 5.
async function addScore(req, res) {
  const { user_id, score } = req.body;

  if (!user_id || !score) {
    return res.status(400).json({ error: 'Missing user_id or score' });
  }
  if (score < 1 || score > 45) {
    return res.status(400).json({ error: 'Score must be a Stableford score between 1 and 45' });
  }

  try {
    // 1. Insert the new score
    const { data: newScore, error: insertError } = await supabase
      .from('scores')
      .insert([{ user_id, score }])
      .select()
      .single();

    if (insertError) throw insertError;

    // 2. Fetch all scores for this user, sorted by created_at DESC (newest first)
    const { data: scores, error: fetchError } = await supabase
      .from('scores')
      .select('id, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    // 3. Keep only the newest 5, delete the rest
    if (scores.length > 5) {
      const idsToDelete = scores.slice(5).map(s => s.id);
      
      const { error: deleteError } = await supabase
        .from('scores')
        .delete()
        .in('id', idsToDelete);
        
      if (deleteError) throw deleteError;
    }

    return res.status(200).json({ 
      message: 'Score added successfully', 
      score: newScore,
      info: 'Kept latest 5 scores only'
    });

  } catch (err) {
    console.error('Error adding score:', err);
    return res.status(500).json({ error: 'Internal server error while processing score' });
  }
}

module.exports = {
  addScore
};

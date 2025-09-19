export default function handler(req, res) {
  res.status(200).json({
    hasSupabaseUrl: !!process.env.REACT_APP_SUPABASE_URL,
    hasSupabaseKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
    supabaseUrlDomain: process.env.REACT_APP_SUPABASE_URL ? new URL(process.env.REACT_APP_SUPABASE_URL).hostname : null,
    timestamp: new Date().toISOString()
  });
}
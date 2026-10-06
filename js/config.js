window.MOP_CONFIG = {
  supabaseUrl: "https://ijcqgitluzefphomkkmo.supabase.co",
  supabaseKey: "sb_publishable_iMIfKJ00rw11iIacTz3BCg_3yhn0n7l"
};

window.MOP_SUPABASE = window.supabase.createClient(
  window.MOP_CONFIG.supabaseUrl,
  window.MOP_CONFIG.supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Supabase Configuration
// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://ouweuekklopizmnkrvob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91d2V1ZWtrbG9waXptbmtydm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTYwNjMsImV4cCI6MjA4NTk5MjA2M30.Zs5HMTLSXsYBpTRdHMYy0DctYfJNd9MoCSytaHcz_zc';

// Initialize the Supabase client
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully!');
} catch (error) {
    console.error("Erreur d'initialisation Supabase (Vérifiez la clé ou l'URL) : ", error);
}

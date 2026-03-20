// Fallback to fetch if supabase-js fails
const SUPABASE_URL = 'https://ouweuekklopizmnkrvob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91d2V1ZWtrbG9waXptbmtydm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTYwNjMsImV4cCI6MjA4NTk5MjA2M30.Zs5HMTLSXsYBpTRdHMYy0DctYfJNd9MoCSytaHcz_zc';

async function testCounts() {
    const tables = ['etudiant', 'professeur', 'organisateur', 'evenement', 'participation', 'Events', 'Event'];
    for (const table of tables) {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            const data = await res.json();
            console.log(`Table ${table}:`, data.length !== undefined ? `${data.length} rows` : data);
        } catch (e) {
            console.log(`Table ${table} error:`, e.message);
        }
    }
}

testCounts();

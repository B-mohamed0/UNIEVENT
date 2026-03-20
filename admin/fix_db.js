const SUPABASE_URL = 'https://ouweuekklopizmnkrvob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91d2V1ZWtrbG9waXptbmtydm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTYwNjMsImV4cCI6MjA4NTk5MjA2M30.Zs5HMTLSXsYBpTRdHMYy0DctYfJNd9MoCSytaHcz_zc';

async function updatePassword(id, hashedPass) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admin?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            password: hashedPass
        })
    });
    console.log(`Update ${id} status:`, res.status);
    const data = await res.json();
    console.log(`Update ${id} data:`, data);
}

async function fix() {
    // hash for "123"
    const hash123 = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    
    // mohamed@gmail.com (id: 1) has password '123'
    await updatePassword(1, hash123);
    
    // hamza12@gmail.com (id: 2) has password '123\n'
    await updatePassword(2, hash123);
}

fix();

const SUPABASE_URL = 'https://ouweuekklopizmnkrvob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91d2V1ZWtrbG9waXptbmtydm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTYwNjMsImV4cCI6MjA4NTk5MjA2M30.Zs5HMTLSXsYBpTRdHMYy0DctYfJNd9MoCSytaHcz_zc';

async function test() {
    console.log("Calling check_admin_login...");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_admin_login`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            p_email: 'mohamed@gmail.com',
            p_password: '123'
        })
    });

    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Data:", data);
}

test();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ouweuekklopizmnkrvob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91d2V1ZWtrbG9waXptbmtydm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTYwNjMsImV4cCI6MjA4NTk5MjA2M30.Zs5HMTLSXsYBpTRdHMYy0DctYfJNd9MoCSytaHcz_zc';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const { data: etu, error: eErr } = await supabaseClient.from('etudiant').select('*');
    console.log("etudiant:", etu);
    const { data: prof, error: pErr } = await supabaseClient.from('professeur').select('*');
    console.log("professeur:", prof);
    const { data: org, error: oErr } = await supabaseClient.from('organisateur').select('*');
    console.log("organisateur:", org);
}
test();

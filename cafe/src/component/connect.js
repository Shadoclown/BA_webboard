// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://jkpkmuhucbxzhiuvrenk.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcGttdWh1Y2J4emhpdXZyZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzY0NTcsImV4cCI6MjA2MjM1MjQ1N30.4-EhZCkA3l0yZrAomvle-I_FjmX_9OgRT2tU86HW3Q4';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
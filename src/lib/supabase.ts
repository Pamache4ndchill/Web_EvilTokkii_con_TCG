import { createClient } from '@supabase/supabase-js';

// 1. Supabase para Contenido Web (Dinámicas: eventos, sorteos, participaciones)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://przzwhwkiqjsjimfnmgy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByenp3aHdraXFqc2ppbWZubWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NDYyODMsImV4cCI6MjEwNjQyMjI4M30.Z3SYD3Yp9r3mfI7cHlnRK5Z8HbRkOttQmBsTz2H1OTQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Supabase para Autenticación de Twitch, Perfiles, Minijuegos, Puntos y Leaderboards
const supabaseMinigamesUrl = import.meta.env.VITE_SUPABASE_MINIGAMES_URL || 'https://przzwhwkiqjsjimfnmgy.supabase.co';
const supabaseMinigamesAnonKey = import.meta.env.VITE_SUPABASE_MINIGAMES_ANON_KEY || '';

export const supabaseMinigames = createClient(supabaseMinigamesUrl, supabaseMinigamesAnonKey);
export const supabaseAuth = supabaseMinigames;

import { createClient } from '@supabase/supabase-js';

// 1. Supabase para Contenido Web (Dinámicas: eventos, sorteos, participaciones)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jdikrnfzepqmulguepnc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Supabase para Autenticación de Twitch, Perfiles, Minijuegos, Puntos y Leaderboards
const supabaseMinigamesUrl = import.meta.env.VITE_SUPABASE_MINIGAMES_URL || 'https://przzwhwkiqjsjimfnmgy.supabase.co';
const supabaseMinigamesAnonKey = import.meta.env.VITE_SUPABASE_MINIGAMES_ANON_KEY || '';

export const supabaseMinigames = createClient(supabaseMinigamesUrl, supabaseMinigamesAnonKey);
export const supabaseAuth = supabaseMinigames;

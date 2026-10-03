-- ============================================================================
-- SQL DEFINITIVO: TRIGGER TWITCH + PERMISOS + POLÍTICAS RLS COMPLETAS
-- Ejecuta este script en el SQL Editor de Supabase: przzwhwkiqjsjimfnmgy
-- ============================================================================

-- 1. Permisos base en el esquema public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Función Trigger de creación / sincronización de usuario Twitch
CREATE OR REPLACE FUNCTION public.handle_new_twitch_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_username TEXT;
  v_avatar TEXT;
BEGIN
  -- Extraer username de los metadatos de Twitch de forma segura
  v_username := COALESCE(
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'custom_claims'->>'preferred_username',
    'Usuario_' || substr(new.id::text, 1, 6)
  );

  -- Extraer avatar de los metadatos de Twitch de forma segura
  v_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    new.raw_user_meta_data->>'profile_image_url',
    ''
  );

  -- Insertar o actualizar el perfil en public.profiles
  INSERT INTO public.profiles (
    id,
    username,
    avatar_url,
    points,
    current_streak,
    role,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    v_username,
    v_avatar,
    0,
    0,
    'usuario',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = CASE 
      WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url 
      ELSE public.profiles.avatar_url 
    END,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ante cualquier anomalía, no bloquear el acceso de Supabase Auth
    RAISE WARNING 'Aviso en handle_new_twitch_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Habilitar ejecución de la función
GRANT EXECUTE ON FUNCTION public.handle_new_twitch_user() TO postgres, anon, authenticated, service_role;

-- 4. Recrear el Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_twitch_user();

-- 5. Función segura para Rotación Mensual de Leaderboards
CREATE OR REPLACE FUNCTION public.rotate_monthly_leaderboard(target_year_month TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  top_users JSONB;
BEGIN
  IF EXISTS (SELECT 1 FROM public.monthly_leaderboards WHERE year_month = target_year_month) THEN
    RETURN false;
  END IF;

  SELECT jsonb_agg(sub) INTO top_users
  FROM (
    SELECT username, avatar_url, points, role
    FROM public.profiles
    ORDER BY points DESC
    LIMIT 10
  ) sub;

  INSERT INTO public.monthly_leaderboards (year_month, leaderboard_data)
  VALUES (target_year_month, COALESCE(top_users, '[]'::jsonb));

  UPDATE public.profiles
  SET points = 0;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_monthly_leaderboard(TEXT) TO authenticated, service_role;

-- 6. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minigames_content ENABLE ROW LEVEL SECURITY;

-- 7. REINICIAR POLÍTICAS RLS LIMPIAS Y COMPLETAS

-- Tablas: profiles
DROP POLICY IF EXISTS "Permitir lectura publica de profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir a usuarios autenticados insertar o actualizar su profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir service_role control total profiles" ON public.profiles;

CREATE POLICY "Permitir lectura publica de profiles"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir a usuarios autenticados insertar o actualizar su profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Permitir service_role control total profiles"
ON public.profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Tablas: user_quiz_completions
DROP POLICY IF EXISTS "Permitir lectura publica de completions" ON public.user_quiz_completions;
DROP POLICY IF EXISTS "Permitir insercion de completions a usuarios autenticados" ON public.user_quiz_completions;
DROP POLICY IF EXISTS "Permitir actualizacion de completions a usuarios autenticados" ON public.user_quiz_completions;
DROP POLICY IF EXISTS "Permitir service_role control total completions" ON public.user_quiz_completions;

CREATE POLICY "Permitir lectura publica de completions"
ON public.user_quiz_completions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir insercion de completions a usuarios autenticados"
ON public.user_quiz_completions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualizacion de completions a usuarios autenticados"
ON public.user_quiz_completions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir service_role control total completions"
ON public.user_quiz_completions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Tablas: user_reports
DROP POLICY IF EXISTS "Permitir a usuarios ver sus propios reportes" ON public.user_reports;
DROP POLICY IF EXISTS "Permitir insercion de reportes a usuarios autenticados" ON public.user_reports;
DROP POLICY IF EXISTS "Permitir service_role control total reportes" ON public.user_reports;

CREATE POLICY "Permitir a usuarios ver sus propios reportes"
ON public.user_reports FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Permitir insercion de reportes a usuarios autenticados"
ON public.user_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir service_role control total reportes"
ON public.user_reports FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Tablas: minigames_content
DROP POLICY IF EXISTS "Permitir lectura publica de minigames_content" ON public.minigames_content;
DROP POLICY IF EXISTS "Permitir gestion completa de contenidos a service_role" ON public.minigames_content;

CREATE POLICY "Permitir lectura publica de minigames_content"
ON public.minigames_content FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir gestion completa de contenidos a service_role"
ON public.minigames_content FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Tablas: monthly_leaderboards
DROP POLICY IF EXISTS "Permitir lectura publica de leaderboards" ON public.monthly_leaderboards;
DROP POLICY IF EXISTS "Permitir gestion completa de leaderboards a service_role" ON public.monthly_leaderboards;

CREATE POLICY "Permitir lectura publica de leaderboards"
ON public.monthly_leaderboards FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir gestion completa de leaderboards a service_role"
ON public.monthly_leaderboards FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

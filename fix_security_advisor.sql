-- ============================================================================
-- SCRIPT DE SEGURIDAD PARA RESOLVER ALERTAS DE SUPABASE SECURITY ADVISOR
-- ============================================================================

-- 1. CORREGIR FUNCION TRIGGER PARA TWITCH CON SEARCH_PATH SEGURO
CREATE OR REPLACE FUNCTION public.handle_new_twitch_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, points, current_streak)
  VALUES (
    new.id,
    COALESCE(
        new.raw_user_meta_data->>'custom_claims'->>'preferred_username',
        new.raw_user_meta_data->>'preferred_username',
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'full_name',
        'Usuario'
    ),
    COALESCE(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture',
        ''
    ),
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. CORREGIR FUNCION DE ROTACION MENSUAL CON SEARCH_PATH SEGURO
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

-- 3. REVOCAR EJECUCION PUBLICA DIRECTA DE FUNCIONES INTERNAS
REVOKE EXECUTE ON FUNCTION public.handle_new_twitch_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rotate_monthly_leaderboard(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.rotate_monthly_leaderboard(TEXT) TO authenticated, service_role;

-- 4. AJUSTAR POLITICAS RLS PARA EVITAR ADVERTENCIAS 'ALWAYS TRUE'
DROP POLICY IF EXISTS "Permitir insercion publica de profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir actualizacion de profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir insercion de completions" ON public.user_quiz_completions;
DROP POLICY IF EXISTS "Permitir insertar reportes" ON public.user_reports;
DROP POLICY IF EXISTS "Permitir actualizar reportes" ON public.user_reports;
DROP POLICY IF EXISTS "Permitir gestion de leaderboards" ON public.monthly_leaderboards;
DROP POLICY IF EXISTS "Permitir gestion de minigames_content" ON public.minigames_content;

-- Politicas limpias y seguras:
CREATE POLICY "Permitir a usuarios autenticados insertar o actualizar su profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Permitir insercion de completions a usuarios autenticados"
ON public.user_quiz_completions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir insercion de reportes a usuarios autenticados"
ON public.user_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir gestion completa de contenidos a service_role"
ON public.minigames_content FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir gestion completa de leaderboards a service_role"
ON public.monthly_leaderboards FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

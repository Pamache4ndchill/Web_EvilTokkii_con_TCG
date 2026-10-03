-- ============================================================================
-- FIX DEFINITIVO: TRIGGER DE REGISTRO DE USUARIOS DE TWITCH
-- ============================================================================

-- 1. Asegurar permisos de ejecución para la función de auth
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Función robusta a prueba de fallos para crear el perfil automáticamente
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
  -- Extraer username de forma segura desde los metadatos de Twitch
  v_username := COALESCE(
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'custom_claims'->>'preferred_username',
    'Usuario_' || substr(new.id::text, 1, 6)
  );

  -- Extraer avatar de forma segura
  v_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    new.raw_user_meta_data->>'profile_image_url',
    ''
  );

  -- Insertar o actualizar perfil
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
    -- En caso de cualquier error imprevisto, registrar aviso y permitir que el usuario se registre
    RAISE WARNING 'Error en handle_new_twitch_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Habilitar ejecución para todos los roles de Supabase Auth
GRANT EXECUTE ON FUNCTION public.handle_new_twitch_user() TO postgres, anon, authenticated, service_role;

-- 4. Recrear el Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_twitch_user();

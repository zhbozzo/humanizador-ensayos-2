# Base de datos – Humanizador

Guía rápida para reproducir el esquema en Supabase, políticas RLS, datos semilla y comportamiento esperado del balance por plan.

## Tablas

- `public.user_profiles`
  - `user_id uuid` – opcional, referencia a `auth.users.id`
  - `email text` – correo del usuario (ÚNICO)
  - `auth_provider text` – `email`, `google`, `apple`, etc.
  - `plan subscription_plan` – `free | basic | pro | ultra` (puede ser `text` si no quieres ENUM)
  - `words_balance int4` – saldo de palabras disponible
  - `next_reset_at timestamptz` – fecha de reseteo mensual (opcional)
  - `created_at timestamptz`
  - `updated_at timestamptz`

- `public.plan_quotas`
  - `plan subscription_plan` – PK
  - `monthly_words int4` – cuota mensual del plan

Ejemplo de datos en `plan_quotas` (tu captura):

| plan  | monthly_words |
|-------|---------------|
| free  | 600           |
| basic | 5000          |
| pro   | 15000         |
| ultra | 30000         |

## SQL (idempotente)

Ejecuta en Supabase → SQL Editor → New query → Run.

```sql
-- 0) ENUM opcional
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'subscription_plan' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.subscription_plan AS ENUM ('free','basic','pro','ultra');
  END IF;
END$$;

-- 1) plan_quotas
CREATE TABLE IF NOT EXISTS public.plan_quotas (
  plan public.subscription_plan PRIMARY KEY,
  monthly_words int4 NOT NULL
);

INSERT INTO public.plan_quotas (plan, monthly_words) VALUES
  ('free', 600),('basic', 5000),('pro', 15000),('ultra', 30000)
ON CONFLICT (plan) DO UPDATE SET monthly_words = EXCLUDED.monthly_words;

-- 2) user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid,
  email text,
  auth_provider text,
  plan public.subscription_plan DEFAULT 'free'::public.subscription_plan,
  words_balance int4 DEFAULT 0,
  next_reset_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices/Únicos
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_key
  ON public.user_profiles(email);
-- (Opcional) por user_id
-- CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_key
--   ON public.user_profiles(user_id);

-- 3) RLS en user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "update own profile" ON public.user_profiles;

CREATE POLICY "select own profile"
ON public.user_profiles
FOR SELECT
USING (email = auth.jwt() ->> 'email');

CREATE POLICY "insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY "update own profile"
ON public.user_profiles
FOR UPDATE
USING (email = auth.jwt() ->> 'email');
```

## Comportamiento esperado

- Primer login/registro: si no existe fila en `user_profiles` para `email`, el frontend inserta una con `plan='free'` y `words_balance=600`.
- Consumo: cada palabra ingresada en el Humanizador descuenta 1 del balance (pendiente de implementar el descuento real — trigger/endpoint).
- `Ultimate` solo para `basic | pro | ultra`.

## Pendientes recomendados

- Descuento de balance en backend o trigger.
- Reset mensual: job programado que ponga `words_balance = plan_quotas.monthly_words` y actualice `next_reset_at`.
- Tabla `usage_logs` para auditoría de consumo.

## Entorno

- Frontend `.env` (raíz): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON`, `VITE_GOOGLE_CLIENT_ID`.

## Troubleshooting

- Si no se crea la fila con 600: verifica índice único por `email` y las 3 policies RLS. Si ya existe una fila con 0, súbela manualmente a 600 la primera vez.
- Si no aparece One Tap: confirma `VITE_GOOGLE_CLIENT_ID`, cookies de terceros, `window.google.accounts.id` y que no haya sesión activa.

## Actualización 2025-09 — Esquema y RPCs implementadas

Cambios añadidos para alinear la app con planes, límites por request y guardado de historial.

### Nuevas columnas en `user_profiles`

- `billing_period text` (`monthly|annual`)
- `plan_started_at timestamptz`
- `plan_renews_at timestamptz`
- `auto_renew boolean DEFAULT true`
- `last_reset_at timestamptz`

SQL sugerido (idempotente):

```sql
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS billing_period text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_renews_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_reset_at timestamptz;
```

### Tabla `humanize_history` (guardado manual)

```sql
CREATE TABLE IF NOT EXISTS public.humanize_history (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  level text NOT NULL, -- standard | ultimate
  input text NOT NULL,
  result text NOT NULL,
  input_len int4,
  result_len int4,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.humanize_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "history self" ON public.humanize_history;
CREATE POLICY "history self" ON public.humanize_history
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');
```

### Funciones (RPC) de suscripción y reseteo

```sql
-- Máximo por request por plan (frontend/backend deben coincidir)
CREATE OR REPLACE FUNCTION public.plan_max_words(p_plan text)
RETURNS int AS $$
  SELECT CASE lower(coalesce(p_plan,''))
    WHEN 'basic' THEN 800
    WHEN 'pro' THEN 1200
    WHEN 'ultra' THEN 1800
    ELSE 600
  END;
$$ LANGUAGE sql IMMUTABLE;

-- Reset del saldo si corresponde (al inicio de un proceso)
CREATE OR REPLACE FUNCTION public.reset_words_if_due(p_email text)
RETURNS void AS $$
DECLARE
  q int;
BEGIN
  SELECT monthly_words INTO q
  FROM public.plan_quotas pq
  JOIN public.user_profiles up ON up.plan = pq.plan
  WHERE up.email = p_email;
  IF q IS NULL THEN RETURN; END IF;

  UPDATE public.user_profiles
  SET words_balance = q,
      last_reset_at = now(),
      next_reset_at = (now() + interval '30 days')
  WHERE email = p_email AND (next_reset_at IS NULL OR now() >= next_reset_at);
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar suscripción/cambio de plan
CREATE OR REPLACE FUNCTION public.apply_subscription(p_email text, p_plan text, p_period text)
RETURNS void AS $$
DECLARE q int; BEGIN
  SELECT monthly_words INTO q FROM public.plan_quotas WHERE plan = p_plan::public.subscription_plan;
  UPDATE public.user_profiles
  SET plan = p_plan::public.subscription_plan,
      billing_period = COALESCE(p_period,'monthly'),
      plan_started_at = now(),
      plan_renews_at = CASE WHEN lower(COALESCE(p_period,'monthly'))='annual' THEN now()+interval '1 year' ELSE now()+interval '30 days' END,
      words_balance = COALESCE(q, words_balance),
      next_reset_at = now()+interval '30 days'
  WHERE email = p_email;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Con esto, la app puede:

- Validar en backend `max_words` por request con `plan_max_words` (ya implementado).
- Llamar `reset_words_if_due(email)` antes de procesar para mantener saldos correctos.
- Cambiar plan/periodo con `apply_subscription` respetando RLS.

-- ============================================================
-- Bravel Veículos — estoquebravel schema
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Tabela de perfis (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text,
  role       text NOT NULL DEFAULT 'VENDEDOR'
               CHECK (role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER', 'VENDEDOR')),
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cria perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', 'VENDEDOR');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  brand        text        NOT NULL,
  model        text        NOT NULL,
  year         integer     NOT NULL,
  year_model   integer,
  km           integer     NOT NULL DEFAULT 0,
  color        text,
  category     text,
  transmission text,
  fuel         text,
  doors        integer     DEFAULT 4,
  motor        text,
  optionals    text[]      DEFAULT '{}',
  is_premium   boolean     NOT NULL DEFAULT false,
  is_new       boolean     NOT NULL DEFAULT false,
  images       text[]      DEFAULT '{}',
  image_url    text,
  price        numeric     NOT NULL,
  status       text        NOT NULL DEFAULT 'disponivel'
                 CHECK (status IN ('disponivel', 'vendido', 'reservado')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  acquired_at  date,
  sold_at      timestamptz,
  archived_at  timestamptz
);

-- RLS — ativar
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles  ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuário lê apenas o próprio perfil
CREATE POLICY "Usuário lê próprio perfil" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Vehicles: todos autenticados leem veículos não arquivados
CREATE POLICY "Autenticados leem estoque" ON vehicles
  FOR SELECT TO authenticated
  USING (archived_at IS NULL);

-- Vehicles: apenas INVENTORY_MANAGER e SUPER_ADMIN inserem
CREATE POLICY "Managers inserem veículos" ON vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER')
        AND active = true
    )
  );

-- Vehicles: apenas INVENTORY_MANAGER e SUPER_ADMIN atualizam (inclui soft delete)
-- WITH CHECK explicito e igual ao USING: sem isso o Postgres reusaria o USING
-- por padrão, mas se a policy no banco já tiver um WITH CHECK divergente
-- (ex: herdado por engano da policy de leitura, com "archived_at IS NULL"),
-- arquivar um veículo (que seta archived_at) falha com
-- "new row violates row-level security policy".
CREATE POLICY "Managers atualizam veículos" ON vehicles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER')
        AND active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER')
        AND active = true
    )
  );

-- Storage — bucket vehicle-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: leitura pública
CREATE POLICY "Imagens públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-images');

-- Storage RLS: upload apenas para autenticados
CREATE POLICY "Autenticados fazem upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images');

-- Storage RLS: deleção apenas para managers
CREATE POLICY "Managers deletam imagens" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vehicle-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER')
        AND active = true
    )
  );

-- ============================================================
-- View pública — usada pelo site institucional (bravelveiculos.com)
-- para listar o estoque sem expor dados internos do admin.
-- A view roda com os privilégios do dono (bypassa a RLS de "authenticated"
-- da tabela vehicles), mas só expõe colunas seguras e veículos disponíveis.
-- ============================================================
DROP VIEW IF EXISTS public_vehicles;

CREATE VIEW public_vehicles AS
SELECT
  id, name, brand, model, year, year_model, km, color, category,
  transmission, fuel, motor, optionals, images, price, created_at,
  is_premium
FROM vehicles
WHERE status = 'disponivel' AND archived_at IS NULL;

GRANT SELECT ON public_vehicles TO anon;

-- ============================================================
-- Migração: campo is_new (selo "Novidade no estoque" nas artes de Story)
-- Rode isso se a tabela vehicles já existia antes desse campo ser criado.
-- ============================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false;

-- ============================================================
-- Para promover um usuário já cadastrado a SUPER_ADMIN:
-- UPDATE profiles SET role = 'SUPER_ADMIN' WHERE id = '<user-uuid>';
-- ============================================================

-- ============================================================
-- Central de Mídias — pastas e mídias geradas a partir do estoque
-- ============================================================

-- Uma pasta lógica por veículo: "Mídias {Modelo}"
CREATE TABLE IF NOT EXISTS media_folders (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  uuid        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  folder_name text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id)
);

-- Mídias geradas (story/post/carrossel) — sempre presas a um veículo e a uma pasta
CREATE TABLE IF NOT EXISTS generated_media (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   uuid        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  folder_id    uuid        NOT NULL REFERENCES media_folders(id) ON DELETE CASCADE,
  media_type   text        NOT NULL CHECK (media_type IN ('story', 'post', 'carousel')),
  title        text        NOT NULL,
  preview_data jsonb       NOT NULL DEFAULT '{}',
  caption      text        NOT NULL DEFAULT '',
  hashtags     text[]      NOT NULL DEFAULT '{}',
  dimensions   jsonb       NOT NULL DEFAULT '{}',
  aspect_ratio text        NOT NULL DEFAULT '',
  status       text        NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'saved', 'archived')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media_folders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_media ENABLE ROW LEVEL SECURITY;

-- media_folders: todos autenticados leem
CREATE POLICY "Autenticados leem pastas de mídia" ON media_folders
  FOR SELECT TO authenticated
  USING (true);

-- media_folders: apenas managers criam/atualizam
CREATE POLICY "Managers inserem pastas de mídia" ON media_folders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER')
        AND active = true
    )
  );

CREATE POLICY "Managers atualizam pastas de mídia" ON media_folders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER')
        AND active = true
    )
  );

-- generated_media: todos autenticados leem
CREATE POLICY "Autenticados leem mídias geradas" ON generated_media
  FOR SELECT TO authenticated
  USING (true);

-- generated_media: apenas managers criam/atualizam (inclui arquivar via status)
CREATE POLICY "Managers inserem mídias geradas" ON generated_media
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER')
        AND active = true
    )
  );

CREATE POLICY "Managers atualizam mídias geradas" ON generated_media
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('SUPER_ADMIN', 'INVENTORY_MANAGER')
        AND active = true
    )
  );

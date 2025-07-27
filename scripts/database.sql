create table public.guidelines (
  id uuid not null default gen_random_uuid (),
  title text not null,
  condition jsonb null,
  priority smallint not null,
  single_use boolean not null default false,
  conflicts_with uuid[] null,
  overrides uuid[] null,
  embedding extensions.vector null,
  fuzzy boolean null default false,
  action jsonb not null,
  constraint guidelines_pkey1 primary key (id)
) TABLESPACE pg_default;

create table public.chats (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  facts jsonb not null default '{}'::jsonb,
  summary text null,
  updated_at timestamp with time zone not null default now(),
  constraint chat_sessions_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_chats_set_updated_at BEFORE
update on chats for EACH row
execute FUNCTION set_updated_at ();

create table public.chats (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  facts jsonb not null default '{}'::jsonb,
  summary text null,
  updated_at timestamp with time zone not null default now(),
  constraint chat_sessions_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_chats_set_updated_at BEFORE
update on chats for EACH row
execute FUNCTION set_updated_at ();

create table public.chats (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  facts jsonb not null default '{}'::jsonb,
  summary text null,
  updated_at timestamp with time zone not null default now(),
  constraint chat_sessions_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_chats_set_updated_at BEFORE
update on chats for EACH row
execute FUNCTION set_updated_at ();

create table public.chat_messages (
  id uuid not null default gen_random_uuid (),
  chat_id uuid null,
  role text null,
  content text not null,
  created_at timestamp without time zone null default now(),
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_chat_id_fkey foreign KEY (chat_id) references chats (id) on update CASCADE on delete CASCADE,
  constraint chat_messages_role_check check (
    (
      role = any (
        array['system'::text, 'user'::text, 'assistant'::text]
      )
    )
  )
) TABLESPACE pg_default;

CREATE TYPE professional_specialty AS ENUM ('coaching','psychology','nutrition');

create table public.professionals (
  id uuid not null default gen_random_uuid (),
  name text not null,
  surname text not null,
  session_price numeric(10, 2) not null,
  session_duration integer not null,
  location text not null,
  online boolean not null,
  description text not null,
  rating numeric(2, 1) not null,
  reviews integer not null,
  specialties professional_specialty[] not null,
  languages text[] not null,
  constraint professionals_pkey primary key (id),
  constraint professionals_rating_check check (
    (
      (rating >= (0)::numeric)
      and (rating <= (5)::numeric)
    )
  ),
  constraint professionals_reviews_check check ((reviews >= 0))
) TABLESPACE pg_default;

CREATE OR REPLACE FUNCTION match_guidelines_improved(
  query_embedding vector(1536),
  match_count int DEFAULT 6,
  similarity_threshold float DEFAULT 0.8,
  min_priority int DEFAULT 5
)
returns table (
  id             uuid,
  title          text,
  priority       smallint,
  single_use     boolean,
  condition      text,
  action         text,
  fuzzy          boolean,
  conflicts_with uuid[],
  overrides      uuid[],
  embedding      vector,
  similarity     float
)
language sql stable
as $$
  select
    id,
    title,
    priority,
    single_use,
    condition,
    action,
    fuzzy,
    conflicts_with,
    overrides,
    embedding,
    1 - (embedding <-> query_embedding) as similarity
  from public.guidelines
  where embedding is not null
    and priority >= min_priority  -- Solo guidelines de alta prioridad
    and (1 - (embedding <-> query_embedding)) >= similarity_threshold  -- Threshold de similitud
  order by embedding <-> query_embedding  -- Ordenar por distancia (menor = más similar)
  limit match_count;
$$;
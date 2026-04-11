-- ── PATRÍCIO IA — SUPABASE SCHEMA ──
-- Corre isto no SQL Editor do Supabase

-- Habilitar RLS (Row Level Security) globalmente
-- Cada utilizador só vê os seus próprios dados

-- ── PERFIS ──
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nome text,
  role text default 'team', -- 'admin' ou 'team'
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Utilizadores veem o próprio perfil" on public.profiles
  for all using (auth.uid() = id);

-- Trigger para criar perfil automaticamente após registo
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'team');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── CONTEÚDO / POSTS ──
create table public.posts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  title text,
  status text default 'ideia',
  tipo text,
  plat text default 'Instagram',
  data_pub date,
  prazo date,
  copy text,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.posts enable row level security;
create policy "Equipa vê todos os posts" on public.posts
  for select using (auth.uid() is not null);
create policy "Qualquer membro cria posts" on public.posts
  for insert with check (auth.uid() is not null);
create policy "Qualquer membro edita posts" on public.posts
  for update using (auth.uid() is not null);
create policy "Qualquer membro apaga posts" on public.posts
  for delete using (auth.uid() is not null);

-- ── FATURAÇÃO ──
create table public.faturacao (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  month text not null,
  year text not null,
  amount numeric default 0,
  note text,
  created_at timestamptz default now()
);
alter table public.faturacao enable row level security;
create policy "Equipa vê faturação" on public.faturacao
  for select using (auth.uid() is not null);
create policy "Qualquer membro gere faturação" on public.faturacao
  for all using (auth.uid() is not null);

-- ── OBJETIVOS ANUAIS DE FATURAÇÃO ──
create table public.fat_targets (
  id bigint generated always as identity primary key,
  year text not null unique,
  amount numeric default 0,
  updated_at timestamptz default now()
);
alter table public.fat_targets enable row level security;
create policy "Equipa vê objetivos" on public.fat_targets
  for select using (auth.uid() is not null);
create policy "Equipa gere objetivos" on public.fat_targets
  for all using (auth.uid() is not null);

-- ── OBJETIVOS PESSOAIS ──
create table public.objectives (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  type text default 'profissional',
  year text default '2026',
  deadline date,
  description text,
  progress int default 0,
  note text,
  sub_objectives jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.objectives enable row level security;
-- Objetivos: só o próprio vê (dados pessoais)
create policy "Só o próprio vê objetivos" on public.objectives
  for all using (auth.uid() = user_id);

-- ── FINANÇAS PESSOAIS ──
create table public.financas (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  description text,
  type text, -- receita, despesa, poupanca
  category text,
  amount numeric default 0,
  date date,
  note text,
  created_at timestamptz default now()
);
alter table public.financas enable row level security;
-- Finanças: SÓ o próprio vê (privado)
create policy "Só o próprio vê finanças" on public.financas
  for all using (auth.uid() = user_id);

-- ── CAPÍTULOS DO LIVRO ──
create table public.book_chapters (
  id bigint generated always as identity primary key,
  chap_type text default 'capitulo',
  num int,
  title text not null,
  status text default 'ideia',
  synopsis text,
  content text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.book_chapters enable row level security;
-- Livro: toda a equipa tem acesso
create policy "Equipa vê capítulos" on public.book_chapters
  for select using (auth.uid() is not null);
create policy "Equipa gere capítulos" on public.book_chapters
  for all using (auth.uid() is not null);

-- ── ADN ──
create table public.adn (
  id bigint generated always as identity primary key,
  key text not null unique,
  value text,
  updated_at timestamptz default now()
);
alter table public.adn enable row level security;
create policy "Equipa vê ADN" on public.adn
  for select using (auth.uid() is not null);
create policy "Equipa gere ADN" on public.adn
  for all using (auth.uid() is not null);

-- ── CONFIGURAÇÕES GLOBAIS (temas, tons, prompts) ──
create table public.config (
  id bigint generated always as identity primary key,
  key text not null unique,
  value jsonb,
  updated_at timestamptz default now()
);
alter table public.adn enable row level security;
create policy "Equipa vê config" on public.config
  for select using (auth.uid() is not null);
create policy "Equipa gere config" on public.config
  for all using (auth.uid() is not null);

-- ── CUSTOS API ──
create table public.api_costs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  date date not null,
  cost numeric default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table public.api_costs enable row level security;
create policy "Utilizador vê os seus custos" on public.api_costs
  for all using (auth.uid() = user_id);

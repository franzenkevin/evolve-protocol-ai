create table if not exists public.protocol_regenerations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  paddle_transaction_id text,
  amount_brl numeric not null default 19.90,
  status text not null default 'pending',
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_protocol_regen_user on public.protocol_regenerations(user_id);
create index if not exists idx_protocol_regen_created on public.protocol_regenerations(created_at desc);

alter table public.protocol_regenerations enable row level security;

create policy "Users view own regenerations"
  on public.protocol_regenerations for select
  using (auth.uid() = user_id);

create policy "Admins view all regenerations"
  on public.protocol_regenerations for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Service role manages regenerations"
  on public.protocol_regenerations for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Admins update regenerations"
  on public.protocol_regenerations for update
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create trigger update_protocol_regenerations_updated_at
before update on public.protocol_regenerations
for each row execute function public.update_updated_at_column();
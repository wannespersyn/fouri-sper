-- Web push subscriptions, per gebruiker (net als streepje_persoon_favoriet)
-- i.p.v. per kamp — een leiding-account blijft ingelogd over kampjaren heen
-- en het toestel/de browser waarop die pushberichten ontvangt verandert daar
-- los van. Eén rij per endpoint: dezelfde gebruiker kan op meerdere
-- toestellen geabonneerd zijn, en hetzelfde toestel kan (na een herinstall)
-- een nieuw endpoint krijgen — vandaar de unique constraint op endpoint i.p.v.
-- op gebruiker_id.

create table push_subscription (
  id uuid primary key default gen_random_uuid(),
  gebruiker_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscription_gebruiker_idx on push_subscription (gebruiker_id);

alter table push_subscription enable row level security;
create policy push_subscription_eigen on push_subscription
  for all to authenticated
  using (gebruiker_id = auth.uid())
  with check (gebruiker_id = auth.uid());
grant select, insert, delete on push_subscription to authenticated;

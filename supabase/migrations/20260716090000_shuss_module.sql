-- Shuss module:
--
-- Shuss is een balspel dat tijdens het kamp gespeeld wordt (mat/tafel,
-- teams tegen elkaar). In plaats van volledige partijen met teams te loggen
-- houdt leiding gewoon per persoon drie simpele tellers bij — net als
-- streepje: elke gebeurtenis is één rij (persoon, soort, tijdstip) i.p.v.
-- een teller die opgehoogd wordt, zodat de geschiedenis bewaard blijft.
-- "soort" is vast (geen kamp-gebonden lijst zoals streepje_type) omdat
-- gewonnen/verloren/adje niet per kamp verschilt.

create table shuss_gebeurtenis (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  streepje_persoon_id uuid not null references streepje_persoon (id) on delete cascade,
  soort text not null check (soort in ('gewonnen', 'verloren', 'adje')),
  created_at timestamptz not null default now()
);

create index shuss_gebeurtenis_kamp_idx on shuss_gebeurtenis (kamp_id);
create index shuss_gebeurtenis_persoon_idx on shuss_gebeurtenis (streepje_persoon_id);

alter table shuss_gebeurtenis enable row level security;
create policy shuss_gebeurtenis_authenticated_all on shuss_gebeurtenis for all to authenticated using (true) with check (true);
grant select, insert, update, delete on shuss_gebeurtenis to authenticated;

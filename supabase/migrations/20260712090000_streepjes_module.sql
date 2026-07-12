-- Streepjes module:
--
-- Drankjes-telling voor leiding tijdens het kamp. Elke streepje is één rij
-- (persoon, type, tijdstip) in plaats van een teller die opgehoogd wordt, zodat
-- de volledige geschiedenis bewaard blijft (en er later eventueel per dag
-- uitgesplitst kan worden zonder schemawijziging). streepje_type is
-- kamp-gebonden, net als leverancier/ingredient, omdat de lijst van soorten
-- per kamp kan verschillen.

create table streepje_type (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  naam text not null,
  kleur text not null default '#8a5ab0',
  volgorde int not null default 0,
  created_at timestamptz not null default now(),
  unique (kamp_id, naam)
);

create index streepje_type_kamp_idx on streepje_type (kamp_id);

create table streepje (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  persoon_id uuid not null references persoon (id) on delete cascade,
  streepje_type_id uuid not null references streepje_type (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index streepje_kamp_idx on streepje (kamp_id);
create index streepje_persoon_idx on streepje (persoon_id);
create index streepje_streepje_type_idx on streepje (streepje_type_id);

-- Seed de standaard soorten voor het huidige actieve kamp — net als
-- groepen/leveranciers starten nieuwe kamps leeg en vult leiding dit zelf aan.
insert into streepje_type (kamp_id, naam, kleur, volgorde)
select k.id, v.naam, v.kleur, v.volgorde
from kamp k
cross join (
  values
    ('Pintje', '#c8a13a', 0),
    ('Sterke', '#a8434a', 1)
) as v(naam, kleur, volgorde)
where k.is_actief
  and not exists (select 1 from streepje_type st where st.kamp_id = k.id and st.naam = v.naam);

alter table streepje_type enable row level security;
create policy streepje_type_authenticated_all on streepje_type for all to authenticated using (true) with check (true);
grant select, insert, update, delete on streepje_type to authenticated;

alter table streepje enable row level security;
create policy streepje_authenticated_all on streepje for all to authenticated using (true) with check (true);
grant select, insert, update, delete on streepje to authenticated;

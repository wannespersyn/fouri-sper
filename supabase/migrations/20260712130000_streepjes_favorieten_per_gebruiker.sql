-- Streepjes: favorieten per gebruiker.
--
-- "Favoriet" stond tot nu toe als één gedeelde vlag op streepje_persoon,
-- zichtbaar voor alle leiding (het "shared authenticated account"-model dat de
-- rest van de app gebruikt). In de praktijk wil elke leider zijn eigen
-- veelgebruikte namen bovenaan, dus favorieten worden hier per gebruiker
-- (auth.uid()) bijgehouden i.p.v. gedeeld per kamp — de eerste écht
-- gebruikersgebonden data in dit schema.

create table streepje_persoon_favoriet (
  streepje_persoon_id uuid not null references streepje_persoon (id) on delete cascade,
  gebruiker_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (streepje_persoon_id, gebruiker_id)
);

create index streepje_persoon_favoriet_gebruiker_idx on streepje_persoon_favoriet (gebruiker_id);

-- Zet de bestaande gedeelde favorieten om naar per-gebruiker rijen voor elke
-- huidige gebruiker, zodat wie al favorieten had ingesteld niets kwijtraakt.
insert into streepje_persoon_favoriet (streepje_persoon_id, gebruiker_id)
select sp.id, u.id
from streepje_persoon sp
cross join auth.users u
where sp.favoriet;

alter table streepje_persoon drop column favoriet;

alter table streepje_persoon_favoriet enable row level security;
create policy streepje_persoon_favoriet_eigen on streepje_persoon_favoriet
  for all to authenticated
  using (gebruiker_id = auth.uid())
  with check (gebruiker_id = auth.uid());
grant select, insert, delete on streepje_persoon_favoriet to authenticated;

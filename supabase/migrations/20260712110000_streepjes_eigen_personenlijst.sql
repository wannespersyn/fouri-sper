-- Streepjes: eigen, aparte personenlijst.
--
-- De eerste versie hergebruikte de volledige persoon-tabel, maar dat bleek in
-- de praktijk te omslachtig: te veel namen om doorheen te zoeken en je moest
-- naar de Groepen-pagina om iemand nieuw toe te voegen. Streepjes krijgt nu
-- een eigen, kamp-gebonden naamlijst die je rechtstreeks vanuit de
-- Streepjes-pagina beheert, met een favoriet-vlag zodat de meest gebruikte
-- namen bovenaan blijven staan.

create table streepje_persoon (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  naam text not null,
  favoriet boolean not null default false,
  created_at timestamptz not null default now()
);

create index streepje_persoon_kamp_idx on streepje_persoon (kamp_id);

alter table streepje drop constraint streepje_persoon_id_fkey;
alter table streepje rename column persoon_id to streepje_persoon_id;
alter index streepje_persoon_idx rename to streepje_streepje_persoon_id_idx;
alter table streepje add constraint streepje_streepje_persoon_id_fkey
  foreign key (streepje_persoon_id) references streepje_persoon (id) on delete cascade;

alter table streepje_persoon enable row level security;
create policy streepje_persoon_authenticated_all on streepje_persoon for all to authenticated using (true) with check (true);
grant select, insert, update, delete on streepje_persoon to authenticated;

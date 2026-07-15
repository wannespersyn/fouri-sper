-- Boodschappen per gerecht:
--
-- Naast het bestaande overzicht per leverancier (boodschappenlijst_voor) wil
-- leiding ook per gerecht kunnen zien welke ingrediënten daarvoor nodig zijn
-- op een besteldag — handig om alvast dingen af te vinken die op voorhand
-- besteld worden (bv. ontbrekend brood voor het ontbijt de dag ervoor al
-- gehaald). Dit afvinken staat los van de leverancier-bestelstatus (open/
-- besteld/geleverd): het is een informele checklist per (dag, gerecht,
-- ingrediënt), niet gekoppeld aan een effectieve bestelling.
--
-- boodschappen_afgevinkt volgt hetzelfde presence-is-waar patroon als
-- afwezigheid: een rij betekent "afgevinkt", geen rij betekent "nog niet".
create table boodschappen_afgevinkt (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  besteldag date not null,
  recept_id uuid not null references recept (id) on delete cascade,
  ingredient_id uuid not null references ingredient (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kamp_id, besteldag, recept_id, ingredient_id)
);

create index boodschappen_afgevinkt_kamp_dag_idx on boodschappen_afgevinkt (kamp_id, besteldag);

alter table boodschappen_afgevinkt enable row level security;
create policy boodschappen_afgevinkt_authenticated_all on boodschappen_afgevinkt for all to authenticated using (true) with check (true);
grant select, insert, update, delete on boodschappen_afgevinkt to authenticated;

-- Zelfde bereik-logica (dag, of dag+1 als de winkel dan gesloten is) als
-- boodschappenlijst_voor(), maar hier gegroepeerd per gerecht i.p.v. enkel per
-- leverancier — de Boodschappen-pagina toont dit genest onder elke
-- leverancier-kaart (leverancier_id erbij zodat de datalaag dat kan
-- groeperen). Enkel ingrediënten die over de hele besteldag nog een netto
-- behoefte hebben (voorraad al afgetrokken) komen erin — net als in het
-- leverancier-overzicht toon je hier geen dingen die al op voorraad liggen.
create or replace function boodschappenlijst_per_gerecht(p_kamp_id uuid, p_besteldag date)
returns table (
  leverancier_id uuid,
  recept_id uuid,
  recept_naam text,
  ingredient_id uuid,
  ingredient_naam text,
  eenheid eenheid,
  hoeveelheid numeric
)
language sql
stable
security invoker
as $$
  with bereik as (
    select
      p_besteldag as vanaf,
      case when winkel_gesloten(p_besteldag + 1) then p_besteldag + 1 else p_besteldag end as tot
  ),
  netto_per_ingredient as (
    select v.ingredient_id
    from v_boodschappenlijst v, bereik b
    where v.kamp_id = p_kamp_id and v.dag between b.vanaf and b.tot
    group by v.ingredient_id
    having greatest(0, sum(v.benodigde_hoeveelheid) - max(v.voorraad_hoeveelheid)) > 0
  )
  select
    i.leverancier_id,
    t.recept_id,
    r.naam as recept_naam,
    beh.ingredient_id,
    i.naam as ingredient_naam,
    i.eenheid,
    sum(beh.hoeveelheid) as hoeveelheid
  from v_maaltijd_behoefte beh
  join bereik b on beh.dag between b.vanaf and b.tot
  join maaltijd_toewijzing t on t.id = beh.toewijzing_id
  join recept r on r.id = t.recept_id
  join ingredient i on i.id = beh.ingredient_id
  join netto_per_ingredient npi on npi.ingredient_id = beh.ingredient_id
  where beh.kamp_id = p_kamp_id
  group by i.leverancier_id, t.recept_id, r.naam, beh.ingredient_id, i.naam, i.eenheid
  having sum(beh.hoeveelheid) > 0;
$$;

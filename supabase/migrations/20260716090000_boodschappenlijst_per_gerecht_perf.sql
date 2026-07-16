-- Fix voor een performanceprobleem in boodschappenlijst_per_gerecht: de vorige
-- versie scande v_maaltijd_behoefte (de zwaarste view in het schema — per
-- maaltijd_toewijzing wordt aanwezigheid en dieetvervanging herberekend) twee
-- keer: één keer onrechtstreeks via v_boodschappenlijst (voor de netto-
-- filter) en nog eens rechtstreeks (voor de opsplitsing per gerecht). Bij een
-- kampperiode van bv. 10 dagen betekent dat 20 volledige herberekeningen per
-- paginabezoek op /boodschappen in plaats van 10.
--
-- Deze versie scant v_maaltijd_behoefte precies één keer via de materialized
-- CTE "behoefte" en leidt zowel de netto-filter als de opsplitsing per
-- gerecht daaruit af.
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
  behoefte as materialized (
    select beh.toewijzing_id, beh.ingredient_id, beh.hoeveelheid
    from v_maaltijd_behoefte beh, bereik b
    where beh.kamp_id = p_kamp_id and beh.dag between b.vanaf and b.tot
  ),
  netto_per_ingredient as (
    select b.ingredient_id
    from behoefte b
    left join voorraad v on v.ingredient_id = b.ingredient_id and v.kamp_id = p_kamp_id
    group by b.ingredient_id
    having greatest(0, sum(b.hoeveelheid) - max(coalesce(v.hoeveelheid, 0))) > 0
  )
  select
    i.leverancier_id,
    t.recept_id,
    r.naam as recept_naam,
    b.ingredient_id,
    i.naam as ingredient_naam,
    i.eenheid,
    sum(b.hoeveelheid) as hoeveelheid
  from behoefte b
  join maaltijd_toewijzing t on t.id = b.toewijzing_id
  join recept r on r.id = t.recept_id
  join ingredient i on i.id = b.ingredient_id
  join netto_per_ingredient npi on npi.ingredient_id = b.ingredient_id
  group by i.leverancier_id, t.recept_id, r.naam, b.ingredient_id, i.naam, i.eenheid
  having sum(b.hoeveelheid) > 0;
$$;

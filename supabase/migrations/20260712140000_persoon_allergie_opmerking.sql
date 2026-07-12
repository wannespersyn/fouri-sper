-- Vrije-tekst veld op persoon voor specifieke allergieën/dieetopmerkingen die
-- niet in een standaard dieettype-tag passen (bv. "geen kiwi", "lichte
-- lactose-intolerantie behalve kaas"). Komt bovenop persoon_dieettype, niet
-- in de plaats van.
alter table persoon add column allergie_opmerking text;

-- v_recept_status uitgebreid met het aantal personen met een ingevulde
-- allergie_opmerking die dit recept effectief te eten krijgen (via hun groep
-- ingepland op een maaltijd_toewijzing). Vrije tekst kan niet automatisch
-- opgelost worden zoals een dieettype-aanpassing, dus dit blijft een aparte
-- "manueel na te kijken"-teller naast ontbrekende_dieten_aantal.
create or replace view v_recept_status
with (security_invoker = on) as
with kamp_dieet_gebruik as (
  select distinct p.kamp_id, pd.dieettype_id
  from persoon p
  join persoon_dieettype pd on pd.persoon_id = p.id
),
recept_ingredienten as (
  select recept_id, count(*) as aantal
  from recept_ingredient
  group by recept_id
),
recept_groepen as (
  select t.recept_id, count(distinct tg.groep_id) as aantal
  from maaltijd_toewijzing t
  join maaltijd_toewijzing_groep tg on tg.toewijzing_id = t.id
  group by t.recept_id
),
recept_ontbrekend as (
  select
    r.id as recept_id,
    array_agg(distinct d.naam order by d.naam) as ontbrekende_dieten
  from recept r
  join kamp_dieet_gebruik kdg on kdg.kamp_id = r.kamp_id
  join dieettype d on d.id = kdg.dieettype_id
  where not exists (
    select 1 from recept_dieet_aanpassing rda
    where rda.recept_id = r.id and rda.dieettype_id = kdg.dieettype_id
  )
  group by r.id
),
recept_allergie_opmerking as (
  select t.recept_id, count(distinct p.id) as aantal
  from maaltijd_toewijzing t
  join maaltijd_toewijzing_groep tg on tg.toewijzing_id = t.id
  join persoon p on p.groep_id = tg.groep_id
  where p.allergie_opmerking is not null and btrim(p.allergie_opmerking) <> ''
  group by t.recept_id
)
select
  r.id as recept_id,
  r.kamp_id,
  coalesce(ri.aantal, 0) as ingredienten_aantal,
  coalesce(rg.aantal, 0) as groepen_ingepland,
  coalesce(ro.ontbrekende_dieten, array[]::text[]) as ontbrekende_dieten,
  coalesce(array_length(ro.ontbrekende_dieten, 1), 0) as ontbrekende_dieten_aantal,
  coalesce(rao.aantal, 0) as allergie_opmerkingen_aantal
from recept r
left join recept_ingredienten ri on ri.recept_id = r.id
left join recept_groepen rg on rg.recept_id = r.id
left join recept_ontbrekend ro on ro.recept_id = r.id
left join recept_allergie_opmerking rao on rao.recept_id = r.id;

grant select on v_recept_status to authenticated;

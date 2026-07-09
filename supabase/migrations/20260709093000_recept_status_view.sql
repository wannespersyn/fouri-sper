-- Aggregates the bits the Recepten overview/detail pages need per recept:
-- how many ingrediënten it has, how many groepen currently use it (via the
-- menuplanner, once that exists), and which diëttypes are actually in use
-- somewhere in the kamp but still have no recept_dieet_aanpassing row on
-- this recept ("allergieën nog in te vullen" warning). Kept as a view so
-- this logic lives in one place rather than duplicated in the app layer.

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
)
select
  r.id as recept_id,
  r.kamp_id,
  coalesce(ri.aantal, 0) as ingredienten_aantal,
  coalesce(rg.aantal, 0) as groepen_ingepland,
  coalesce(ro.ontbrekende_dieten, array[]::text[]) as ontbrekende_dieten,
  coalesce(array_length(ro.ontbrekende_dieten, 1), 0) as ontbrekende_dieten_aantal
from recept r
left join recept_ingredienten ri on ri.recept_id = r.id
left join recept_groepen rg on rg.recept_id = r.id
left join recept_ontbrekend ro on ro.recept_id = r.id;

grant select on v_recept_status to authenticated;

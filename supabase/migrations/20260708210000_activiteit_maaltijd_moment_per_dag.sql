-- Meal-moments for a multi-day activiteit can now vary per day (e.g. miss
-- only breakfast on the first day, miss everything in between) instead of
-- one set applying uniformly across the whole date range.

alter table activiteit_maaltijd_moment drop constraint activiteit_maaltijd_moment_pkey;
alter table activiteit_maaltijd_moment add column dag date not null;
alter table activiteit_maaltijd_moment add primary key (activiteit_id, dag, moment);

drop function if exists upsert_activiteit(uuid, uuid, uuid, text, date, date, text, maaltijd_moment[]);

-- Creates or edits an activiteit and materializes the afwezigheid rows it
-- implies (one per dag/moment pair present in p_dagen, for the activiteit's
-- groep). On edit, previously materialized rows for this activiteit are
-- dropped and rebuilt from p_dagen — simpler and safer than diffing. A
-- day/moment already forced absent by another activiteit or a manual toggle
-- has its afwezigheid row's activiteit_id reassigned to this one (the
-- unique index on (maaltijd_id, groep_id) allows only one reason at a time
-- per meal, so the most recently (re)saved activiteit wins there).
create or replace function upsert_activiteit(
  p_id uuid,
  p_kamp_id uuid,
  p_groep_id uuid,
  p_naam text,
  p_van_datum date,
  p_tot_datum date,
  p_kleur text,
  p_dagen jsonb -- {"2026-07-10": ["ontbijt", "middag"], ...}
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_dag_rec record;
  v_dag date;
  v_moment maaltijd_moment;
  v_maaltijd_id uuid;
begin
  if p_id is null then
    insert into activiteit (kamp_id, groep_id, naam, van_datum, tot_datum, kleur)
    values (p_kamp_id, p_groep_id, p_naam, p_van_datum, p_tot_datum, p_kleur)
    returning id into v_id;
  else
    v_id := p_id;
    update activiteit
    set groep_id = p_groep_id, naam = p_naam, van_datum = p_van_datum,
        tot_datum = p_tot_datum, kleur = p_kleur
    where id = v_id and kamp_id = p_kamp_id;
    delete from afwezigheid where activiteit_id = v_id;
    delete from activiteit_maaltijd_moment where activiteit_id = v_id;
  end if;

  for v_dag_rec in select key::date as dag, value as momenten from jsonb_each(p_dagen)
  loop
    v_dag := v_dag_rec.dag;
    for v_moment in select jsonb_array_elements_text(v_dag_rec.momenten)::maaltijd_moment
    loop
      insert into activiteit_maaltijd_moment (activiteit_id, dag, moment)
      values (v_id, v_dag, v_moment)
      on conflict do nothing;

      insert into maaltijd (kamp_id, dag, moment)
      values (p_kamp_id, v_dag, v_moment)
      on conflict (kamp_id, dag, moment) do nothing;

      select id into v_maaltijd_id from maaltijd
      where kamp_id = p_kamp_id and dag = v_dag and moment = v_moment;

      insert into afwezigheid (kamp_id, maaltijd_id, groep_id, activiteit_id)
      values (p_kamp_id, v_maaltijd_id, p_groep_id, v_id)
      on conflict (maaltijd_id, groep_id) do update set activiteit_id = excluded.activiteit_id;
    end loop;
  end loop;

  return v_id;
end;
$$;

grant execute on function upsert_activiteit(uuid, uuid, uuid, text, date, date, text, jsonb) to authenticated;

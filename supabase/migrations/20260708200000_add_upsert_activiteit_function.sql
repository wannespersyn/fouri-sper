-- upsert_activiteit was added to the init_schema migration after it had
-- already been pushed to the remote database, so the function itself was
-- never actually created there even though activiteit/activiteit_maaltijd_moment
-- exist. This re-adds it as its own migration so the deployed schema catches
-- up with what src/app/(app)/activiteiten/actions.ts has always called.

-- Creates or edits an activiteit and materializes the afwezigheid rows it
-- implies (one per dag × moment in range, for the activiteit's groep).
-- On edit, previously materialized rows for this activiteit are dropped
-- and rebuilt from the new range/momenten — simpler and safer than diffing.
-- A day/moment already forced absent by another activiteit or a manual
-- toggle has its afwezigheid row's activiteit_id reassigned to this one
-- (the unique index on (maaltijd_id, groep_id) allows only one reason at a
-- time per meal, so the most recently (re)saved activiteit wins there).
create or replace function upsert_activiteit(
  p_id uuid,
  p_kamp_id uuid,
  p_groep_id uuid,
  p_naam text,
  p_van_datum date,
  p_tot_datum date,
  p_kleur text,
  p_momenten maaltijd_moment[]
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
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

  insert into activiteit_maaltijd_moment (activiteit_id, moment)
  select v_id, m from unnest(p_momenten) as m
  on conflict do nothing;

  for v_dag in select generate_series(p_van_datum, p_tot_datum, interval '1 day')::date
  loop
    foreach v_moment in array p_momenten
    loop
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

grant execute on function upsert_activiteit(uuid, uuid, uuid, text, date, date, text, maaltijd_moment[]) to authenticated;

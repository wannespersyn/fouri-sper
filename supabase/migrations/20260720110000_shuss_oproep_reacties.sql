-- Houdt shuss-oproepen (zie stuurShussOproep) en de ja/nee-reacties erop bij,
-- zodat leden kunnen aangeven of ze meedoen i.p.v. dat de push enkel een
-- fire-and-forget bericht is. De afzendernaam wordt hier bewust gedenormaliseerd
-- opgeslagen (i.p.v. afzender_id opzoeken via auth.users) — er is geen
-- profieltabel in dit schema en andermans e-mailadres opzoeken vereist de
-- admin-client, wat we hier willen vermijden voor een simpele leesquery.
create table shuss_oproep (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  afzender_id uuid not null references auth.users (id) on delete cascade,
  afzender_naam text not null,
  created_at timestamptz not null default now()
);
create index shuss_oproep_kamp_idx on shuss_oproep (kamp_id);

alter table shuss_oproep enable row level security;
create policy shuss_oproep_authenticated_all on shuss_oproep for all to authenticated using (true) with check (true);
grant select, insert, update, delete on shuss_oproep to authenticated;

-- Eén reactie per gebruiker per oproep (opnieuw klikken past 'm aan i.p.v.
-- een tweede rij toe te voegen). Iedereen mag alle reacties lezen (voor de
-- teller), maar enkel de eigen rij schrijven.
create table shuss_oproep_reactie (
  id uuid primary key default gen_random_uuid(),
  oproep_id uuid not null references shuss_oproep (id) on delete cascade,
  gebruiker_id uuid not null references auth.users (id) on delete cascade,
  reactie text not null check (reactie in ('ja', 'nee')),
  created_at timestamptz not null default now(),
  unique (oproep_id, gebruiker_id)
);
create index shuss_oproep_reactie_oproep_idx on shuss_oproep_reactie (oproep_id);

alter table shuss_oproep_reactie enable row level security;
create policy shuss_oproep_reactie_select_alle on shuss_oproep_reactie for select to authenticated using (true);
create policy shuss_oproep_reactie_eigen_schrijven on shuss_oproep_reactie
  for insert to authenticated with check (gebruiker_id = auth.uid());
create policy shuss_oproep_reactie_eigen_bewerken on shuss_oproep_reactie
  for update to authenticated using (gebruiker_id = auth.uid()) with check (gebruiker_id = auth.uid());
grant select, insert, update on shuss_oproep_reactie to authenticated;

-- Atomaire "ja/nee"-reactie met een harde cap van 4 ja's per oproep (de
-- afzender telt daar automatisch in mee, zie stuurShussOproep). De
-- "select ... for update" op de oproep-rij serialiseert gelijktijdige
-- reacties op dezelfde oproep, zodat twee mensen niet tegelijk de laatste
-- vrije plek kunnen bemachtigen. Bij het terugschakelen van "ja" naar "nee"
-- (of omgekeerd) telt de eigen vorige reactie niet mee tegen de cap.
create or replace function reageer_op_shuss_oproep(p_oproep_id uuid, p_reactie text)
returns void
language plpgsql
security invoker
as $$
declare
  v_aantal_ja int;
begin
  if p_reactie not in ('ja', 'nee') then
    raise exception 'ongeldige reactie: %', p_reactie;
  end if;

  perform 1 from shuss_oproep where id = p_oproep_id for update;

  if p_reactie = 'ja' then
    select count(*) into v_aantal_ja
    from shuss_oproep_reactie
    where oproep_id = p_oproep_id and reactie = 'ja' and gebruiker_id <> auth.uid();

    if v_aantal_ja >= 4 then
      raise exception 'shuss_oproep_vol';
    end if;
  end if;

  insert into shuss_oproep_reactie (oproep_id, gebruiker_id, reactie)
  values (p_oproep_id, auth.uid(), p_reactie)
  on conflict (oproep_id, gebruiker_id) do update set reactie = excluded.reactie, created_at = now();
end;
$$;

grant execute on function reageer_op_shuss_oproep(uuid, text) to authenticated;

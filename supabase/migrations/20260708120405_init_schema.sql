-- Fouri SPER canonical schema
-- Single shared team account; all authenticated users can read and write.

create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================

create type groep_type as enum ('tak', 'leiding', 'fouri', 'externen');
create type eenheid as enum ('g', 'kg', 'l', 'ml', 'st', 'sn');
create type recept_status as enum ('concept', 'klaar', 'allergieën-nog-in-te-vullen');
create type hoeveelheid_modus as enum ('per_persoon', 'vast_totaal');
create type maaltijd_moment as enum ('ontbijt', 'tienuurtje', 'middag', 'vieruurtje', 'avond', 'middernacht_snack');
create type boodschappenlijst_status as enum ('open', 'besteld', 'geleverd');

-- ============================================================
-- Kamp & mensen
-- ============================================================

create table kamp (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  start_datum date not null,
  eind_datum date not null,
  is_actief boolean not null default false,
  created_at timestamptz not null default now(),
  constraint kamp_datums_check check (eind_datum >= start_datum)
);

create unique index kamp_een_actief_idx on kamp (is_actief) where is_actief;

create table groep (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  naam text not null,
  type groep_type not null default 'tak',
  basis_aantal int not null default 0,
  kleur text not null default '#2f6d4f',
  volgorde int not null default 0,
  created_at timestamptz not null default now(),
  constraint groep_basis_aantal_check check (basis_aantal >= 0)
);

create index groep_kamp_idx on groep (kamp_id);

create table dieettype (
  id uuid primary key default gen_random_uuid(),
  naam text not null unique,
  kleur text not null default '#c8763a',
  created_at timestamptz not null default now()
);

create table persoon (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  groep_id uuid not null references groep (id) on delete cascade,
  naam text not null,
  created_at timestamptz not null default now()
);

create index persoon_kamp_idx on persoon (kamp_id);
create index persoon_groep_idx on persoon (groep_id);

create table persoon_dieettype (
  persoon_id uuid not null references persoon (id) on delete cascade,
  dieettype_id uuid not null references dieettype (id) on delete cascade,
  primary key (persoon_id, dieettype_id)
);

create index persoon_dieettype_dieettype_idx on persoon_dieettype (dieettype_id);

-- ============================================================
-- Leveranciers
-- ============================================================

create table leverancier (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  naam text not null,
  type text,
  contact_info text,
  besteldeadline_dagen int not null default 0,
  created_at timestamptz not null default now(),
  constraint leverancier_deadline_check check (besteldeadline_dagen >= 0)
);

create index leverancier_kamp_idx on leverancier (kamp_id);

-- ============================================================
-- Recepten & ingrediënten
-- ============================================================

create table ingredient (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  naam text not null,
  eenheid eenheid not null default 'g',
  verpakkingsgrootte numeric,
  leverancier_id uuid references leverancier (id) on delete set null,
  categorie text,
  created_at timestamptz not null default now(),
  constraint ingredient_verpakking_check check (verpakkingsgrootte is null or verpakkingsgrootte > 0)
);

create index ingredient_kamp_idx on ingredient (kamp_id);
create index ingredient_leverancier_idx on ingredient (leverancier_id);

create table recept (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  naam text not null,
  categorie text,
  status recept_status not null default 'concept',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recept_kamp_idx on recept (kamp_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recept_set_updated_at
before update on recept
for each row
execute function set_updated_at();

create table recept_ingredient (
  id uuid primary key default gen_random_uuid(),
  recept_id uuid not null references recept (id) on delete cascade,
  ingredient_id uuid not null references ingredient (id) on delete restrict,
  modus hoeveelheid_modus not null default 'per_persoon',
  hoeveelheid_per_persoon numeric,
  vast_totaal numeric,
  volgorde int not null default 0,
  constraint recept_ingredient_modus_check check (
    (modus = 'per_persoon' and hoeveelheid_per_persoon is not null and vast_totaal is null)
    or (modus = 'vast_totaal' and vast_totaal is not null and hoeveelheid_per_persoon is null)
  )
);

create index recept_ingredient_recept_idx on recept_ingredient (recept_id);
create index recept_ingredient_ingredient_idx on recept_ingredient (ingredient_id);

create table recept_dieet_aanpassing (
  id uuid primary key default gen_random_uuid(),
  recept_id uuid not null references recept (id) on delete cascade,
  dieettype_id uuid not null references dieettype (id) on delete cascade,
  vervangt_ingredient_id uuid references ingredient (id) on delete set null,
  vervangen_door_ingredient_id uuid references ingredient (id) on delete set null,
  modus hoeveelheid_modus,
  hoeveelheid_per_persoon numeric,
  vast_totaal numeric,
  notitie text,
  constraint recept_dieet_aanpassing_modus_check check (
    modus is null
    or (modus = 'per_persoon' and hoeveelheid_per_persoon is not null and vast_totaal is null)
    or (modus = 'vast_totaal' and vast_totaal is not null and hoeveelheid_per_persoon is null)
  )
);

create index recept_dieet_aanpassing_recept_idx on recept_dieet_aanpassing (recept_id);
create index recept_dieet_aanpassing_dieettype_idx on recept_dieet_aanpassing (dieettype_id);
create index recept_dieet_aanpassing_vervangt_idx on recept_dieet_aanpassing (vervangt_ingredient_id);
create index recept_dieet_aanpassing_vervangen_door_idx on recept_dieet_aanpassing (vervangen_door_ingredient_id);

-- ============================================================
-- Planning: maaltijden, toewijzingen, per-instance overrides
-- ============================================================

create table maaltijd (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  dag date not null,
  moment maaltijd_moment not null,
  created_at timestamptz not null default now(),
  unique (kamp_id, dag, moment)
);

create index maaltijd_kamp_dag_idx on maaltijd (kamp_id, dag);

create table maaltijd_toewijzing (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  maaltijd_id uuid not null references maaltijd (id) on delete cascade,
  recept_id uuid not null references recept (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index maaltijd_toewijzing_maaltijd_idx on maaltijd_toewijzing (maaltijd_id);
create index maaltijd_toewijzing_recept_idx on maaltijd_toewijzing (recept_id);

create table maaltijd_toewijzing_groep (
  toewijzing_id uuid not null references maaltijd_toewijzing (id) on delete cascade,
  groep_id uuid not null references groep (id) on delete cascade,
  primary key (toewijzing_id, groep_id)
);

create index maaltijd_toewijzing_groep_groep_idx on maaltijd_toewijzing_groep (groep_id);

create table maaltijd_toewijzing_ingredient_override (
  id uuid primary key default gen_random_uuid(),
  toewijzing_id uuid not null references maaltijd_toewijzing (id) on delete cascade,
  recept_ingredient_id uuid not null references recept_ingredient (id) on delete cascade,
  modus hoeveelheid_modus not null,
  hoeveelheid_per_persoon numeric,
  vast_totaal numeric,
  unique (toewijzing_id, recept_ingredient_id),
  constraint toewijzing_override_modus_check check (
    (modus = 'per_persoon' and hoeveelheid_per_persoon is not null and vast_totaal is null)
    or (modus = 'vast_totaal' and vast_totaal is not null and hoeveelheid_per_persoon is null)
  )
);

-- ============================================================
-- Activiteiten & aanwezigheid
-- ============================================================

create table activiteit (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  groep_id uuid not null references groep (id) on delete cascade,
  naam text not null,
  van_datum date not null,
  tot_datum date not null,
  kleur text not null default '#8a5ab0',
  created_at timestamptz not null default now(),
  constraint activiteit_datums_check check (tot_datum >= van_datum)
);

create index activiteit_kamp_idx on activiteit (kamp_id);
create index activiteit_groep_idx on activiteit (groep_id);

create table activiteit_maaltijd_moment (
  activiteit_id uuid not null references activiteit (id) on delete cascade,
  moment maaltijd_moment not null,
  primary key (activiteit_id, moment)
);

create table afwezigheid (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  maaltijd_id uuid not null references maaltijd (id) on delete cascade,
  groep_id uuid not null references groep (id) on delete cascade,
  activiteit_id uuid references activiteit (id) on delete cascade,
  reden text,
  created_at timestamptz not null default now()
);

create unique index afwezigheid_maaltijd_groep_idx on afwezigheid (maaltijd_id, groep_id);
create index afwezigheid_activiteit_idx on afwezigheid (activiteit_id);

create table persoon_aanwezigheid_override (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  maaltijd_id uuid not null references maaltijd (id) on delete cascade,
  persoon_id uuid not null references persoon (id) on delete cascade,
  aanwezig boolean not null,
  created_at timestamptz not null default now(),
  unique (maaltijd_id, persoon_id)
);

create index persoon_aanwezigheid_override_persoon_idx on persoon_aanwezigheid_override (persoon_id);

-- ============================================================
-- Voorraad, boodschappen, aankoop
-- ============================================================

create table voorraad (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  ingredient_id uuid not null references ingredient (id) on delete cascade,
  hoeveelheid numeric not null default 0,
  bijgewerkt_op timestamptz not null default now(),
  unique (kamp_id, ingredient_id),
  constraint voorraad_hoeveelheid_check check (hoeveelheid >= 0)
);

create table boodschappenlijst (
  id uuid primary key default gen_random_uuid(),
  kamp_id uuid not null references kamp (id) on delete cascade,
  besteldag date not null,
  dekt_tot date not null,
  leverancier_id uuid not null references leverancier (id) on delete cascade,
  status boodschappenlijst_status not null default 'open',
  created_at timestamptz not null default now(),
  constraint boodschappenlijst_datums_check check (dekt_tot >= besteldag)
);

create index boodschappenlijst_kamp_idx on boodschappenlijst (kamp_id);

create table aankoop (
  id uuid primary key default gen_random_uuid(),
  boodschappenlijst_id uuid not null references boodschappenlijst (id) on delete cascade,
  ingredient_id uuid not null references ingredient (id) on delete restrict,
  hoeveelheid numeric not null,
  created_at timestamptz not null default now(),
  constraint aankoop_hoeveelheid_check check (hoeveelheid > 0)
);

create index aankoop_lijst_idx on aankoop (boodschappenlijst_id);

-- ============================================================
-- Belgische feestdagen & helper
-- ============================================================

create table belgische_feestdag (
  datum date primary key,
  naam text not null
);

create or replace function winkel_gesloten(check_date date)
returns boolean
language sql
stable
as $$
  select extract(dow from check_date) = 0
    or exists (select 1 from belgische_feestdag where datum = check_date);
$$;

-- ============================================================
-- RLS: shared authenticated account
-- ============================================================

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'kamp', 'groep', 'dieettype', 'persoon', 'persoon_dieettype',
    'leverancier', 'ingredient', 'recept', 'recept_ingredient', 'recept_dieet_aanpassing',
    'maaltijd', 'maaltijd_toewijzing', 'maaltijd_toewijzing_groep', 'maaltijd_toewijzing_ingredient_override',
    'activiteit', 'activiteit_maaltijd_moment', 'afwezigheid', 'persoon_aanwezigheid_override',
    'voorraad', 'boodschappenlijst', 'aankoop', 'belgische_feestdag'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t || '_authenticated_all', t
    );
  end loop;
end $$;

-- ============================================================
-- Views
-- ============================================================

create or replace view v_persoon_aanwezigheid
with (security_invoker = on) as
select
  m.id as maaltijd_id,
  p.id as persoon_id,
  p.groep_id,
  coalesce(
    o.aanwezig,
    not exists (
      select 1 from afwezigheid a
      where a.maaltijd_id = m.id and a.groep_id = p.groep_id
    )
  ) as aanwezig
from maaltijd m
join persoon p on p.kamp_id = m.kamp_id
left join persoon_aanwezigheid_override o on o.maaltijd_id = m.id and o.persoon_id = p.id;

create or replace view v_aanwezigheid
with (security_invoker = on) as
select
  m.id as maaltijd_id,
  m.kamp_id,
  m.dag,
  m.moment,
  g.id as groep_id,
  g.naam as groep_naam,
  g.basis_aantal,
  exists (
    select 1 from afwezigheid a where a.maaltijd_id = m.id and a.groep_id = g.id
  ) as groep_afwezig,
  case
    when exists (select 1 from afwezigheid a where a.maaltijd_id = m.id and a.groep_id = g.id)
    then (
      select count(*) from v_persoon_aanwezigheid pa
      where pa.maaltijd_id = m.id and pa.groep_id = g.id and pa.aanwezig
    )
    else greatest(0, g.basis_aantal - (
      select count(*) from v_persoon_aanwezigheid pa
      where pa.maaltijd_id = m.id and pa.groep_id = g.id and not pa.aanwezig
    ))
  end as aanwezig_aantal
from maaltijd m
join groep g on g.kamp_id = m.kamp_id;

create or replace view v_maaltijd_behoefte
with (security_invoker = on) as
with toewijzing_eters as (
  select tg.toewijzing_id, coalesce(sum(va.aanwezig_aantal), 0) as eters
  from maaltijd_toewijzing_groep tg
  join maaltijd_toewijzing t on t.id = tg.toewijzing_id
  join v_aanwezigheid va on va.maaltijd_id = t.maaltijd_id and va.groep_id = tg.groep_id
  group by tg.toewijzing_id
),
toewijzing_dieet_eters as (
  select
    tg.toewijzing_id,
    pd.dieettype_id,
    count(distinct p.id) as aantal
  from maaltijd_toewijzing_groep tg
  join maaltijd_toewijzing t on t.id = tg.toewijzing_id
  join persoon p on p.groep_id = tg.groep_id
  join persoon_dieettype pd on pd.persoon_id = p.id
  join v_persoon_aanwezigheid pa on pa.maaltijd_id = t.maaltijd_id and pa.persoon_id = p.id and pa.aanwezig
  group by tg.toewijzing_id, pd.dieettype_id
),
toewijzing_vervangen_eters as (
  select
    tg.toewijzing_id,
    rda.vervangt_ingredient_id as ingredient_id,
    count(distinct p.id) as aantal
  from maaltijd_toewijzing_groep tg
  join maaltijd_toewijzing t on t.id = tg.toewijzing_id
  join recept_dieet_aanpassing rda on rda.recept_id = t.recept_id and rda.vervangt_ingredient_id is not null
  join persoon_dieettype pd on pd.dieettype_id = rda.dieettype_id
  join persoon p on p.id = pd.persoon_id and p.groep_id = tg.groep_id
  join v_persoon_aanwezigheid pa on pa.maaltijd_id = t.maaltijd_id and pa.persoon_id = p.id and pa.aanwezig
  group by tg.toewijzing_id, rda.vervangt_ingredient_id
),
basis_regels as (
  select
    t.id as toewijzing_id,
    t.maaltijd_id,
    t.kamp_id,
    m.dag,
    m.moment,
    ri.id as recept_ingredient_id,
    null::uuid as recept_dieet_aanpassing_id,
    'basis'::text as herkomst,
    null::uuid as dieettype_id,
    ri.ingredient_id,
    case
      when o.id is not null and o.modus = 'vast_totaal' then o.vast_totaal
      when o.id is not null and o.modus = 'per_persoon' then
        o.hoeveelheid_per_persoon * greatest(0, te.eters - coalesce(tve.aantal, 0))
      when ri.modus = 'vast_totaal' then ri.vast_totaal
      else ri.hoeveelheid_per_persoon * greatest(0, te.eters - coalesce(tve.aantal, 0))
    end as hoeveelheid
  from maaltijd_toewijzing t
  join maaltijd m on m.id = t.maaltijd_id
  join recept_ingredient ri on ri.recept_id = t.recept_id
  join toewijzing_eters te on te.toewijzing_id = t.id
  left join maaltijd_toewijzing_ingredient_override o
    on o.toewijzing_id = t.id and o.recept_ingredient_id = ri.id
  left join toewijzing_vervangen_eters tve
    on tve.toewijzing_id = t.id and tve.ingredient_id = ri.ingredient_id
),
aanpassing_regels as (
  select
    t.id as toewijzing_id,
    t.maaltijd_id,
    t.kamp_id,
    m.dag,
    m.moment,
    null::uuid as recept_ingredient_id,
    rda.id as recept_dieet_aanpassing_id,
    'dieet_aanpassing'::text as herkomst,
    rda.dieettype_id,
    rda.vervangen_door_ingredient_id as ingredient_id,
    case
      when rda.modus = 'vast_totaal' then rda.vast_totaal
      else rda.hoeveelheid_per_persoon * coalesce(tde.aantal, 0)
    end as hoeveelheid
  from maaltijd_toewijzing t
  join maaltijd m on m.id = t.maaltijd_id
  join recept_dieet_aanpassing rda on rda.recept_id = t.recept_id
    and rda.vervangen_door_ingredient_id is not null
  left join toewijzing_dieet_eters tde
    on tde.toewijzing_id = t.id and tde.dieettype_id = rda.dieettype_id
)
select * from basis_regels
union all
select * from aanpassing_regels;

create or replace view v_boodschappenlijst
with (security_invoker = on) as
select
  b.kamp_id,
  b.dag,
  b.ingredient_id,
  i.naam as ingredient_naam,
  i.eenheid,
  i.verpakkingsgrootte,
  i.leverancier_id,
  l.naam as leverancier_naam,
  sum(b.hoeveelheid) as benodigde_hoeveelheid,
  coalesce(v.hoeveelheid, 0) as voorraad_hoeveelheid,
  winkel_gesloten(b.dag + 1) as volgende_dag_gesloten
from v_maaltijd_behoefte b
join ingredient i on i.id = b.ingredient_id
left join leverancier l on l.id = i.leverancier_id
left join voorraad v on v.ingredient_id = b.ingredient_id and v.kamp_id = b.kamp_id
group by b.kamp_id, b.dag, b.ingredient_id, i.naam, i.eenheid, i.verpakkingsgrootte, i.leverancier_id, l.naam, v.hoeveelheid;

create or replace function boodschappenlijst_voor(p_kamp_id uuid, p_besteldag date)
returns table (
  ingredient_id uuid,
  ingredient_naam text,
  eenheid eenheid,
  leverancier_id uuid,
  leverancier_naam text,
  benodigde_hoeveelheid numeric,
  voorraad_hoeveelheid numeric,
  netto_hoeveelheid numeric,
  verpakkingsgrootte numeric,
  aantal_verpakkingen numeric,
  dekt_tot date
)
language sql
stable
security invoker
as $$
  with bereik as (
    select
      p_besteldag as vanaf,
      case when winkel_gesloten(p_besteldag + 1) then p_besteldag + 1 else p_besteldag end as tot
  )
  select
    v.ingredient_id,
    v.ingredient_naam,
    v.eenheid,
    v.leverancier_id,
    v.leverancier_naam,
    sum(v.benodigde_hoeveelheid) as benodigde_hoeveelheid,
    max(v.voorraad_hoeveelheid) as voorraad_hoeveelheid,
    greatest(0, sum(v.benodigde_hoeveelheid) - max(v.voorraad_hoeveelheid)) as netto_hoeveelheid,
    max(v.verpakkingsgrootte) as verpakkingsgrootte,
    case when max(v.verpakkingsgrootte) > 0
      then ceil(greatest(0, sum(v.benodigde_hoeveelheid) - max(v.voorraad_hoeveelheid)) / max(v.verpakkingsgrootte))
      else null end as aantal_verpakkingen,
    (select tot from bereik) as dekt_tot
  from v_boodschappenlijst v, bereik b
  where v.kamp_id = p_kamp_id and v.dag between b.vanaf and b.tot
  group by v.ingredient_id, v.ingredient_naam, v.eenheid, v.leverancier_id, v.leverancier_naam
  having greatest(0, sum(v.benodigde_hoeveelheid) - max(v.voorraad_hoeveelheid)) > 0;
$$;

create or replace view v_prep_planning
with (security_invoker = on) as
with toewijzing_eters as (
  select tg.toewijzing_id, coalesce(sum(va.aanwezig_aantal), 0) as eters
  from maaltijd_toewijzing_groep tg
  join maaltijd_toewijzing t on t.id = tg.toewijzing_id
  join v_aanwezigheid va on va.maaltijd_id = t.maaltijd_id and va.groep_id = tg.groep_id
  group by tg.toewijzing_id
),
toewijzing_benodigde_dieten as (
  select distinct tg.toewijzing_id, pd.dieettype_id
  from maaltijd_toewijzing_groep tg
  join maaltijd_toewijzing t on t.id = tg.toewijzing_id
  join persoon p on p.groep_id = tg.groep_id
  join persoon_dieettype pd on pd.persoon_id = p.id
  join v_persoon_aanwezigheid pa on pa.maaltijd_id = t.maaltijd_id and pa.persoon_id = p.id and pa.aanwezig
),
toewijzing_ontbrekend as (
  select
    bd.toewijzing_id,
    array_agg(distinct d.naam order by d.naam) as ontbrekende_dieten
  from toewijzing_benodigde_dieten bd
  join maaltijd_toewijzing t on t.id = bd.toewijzing_id
  join dieettype d on d.id = bd.dieettype_id
  where not exists (
    select 1 from recept_dieet_aanpassing rda
    where rda.recept_id = t.recept_id and rda.dieettype_id = bd.dieettype_id
  )
  group by bd.toewijzing_id
)
select
  t.id as toewijzing_id,
  t.kamp_id,
  m.id as maaltijd_id,
  m.dag,
  m.moment,
  t.recept_id,
  r.naam as recept_naam,
  r.status as recept_status,
  te.eters,
  coalesce(
    (select array_agg(g.naam order by g.volgorde)
     from maaltijd_toewijzing_groep tg
     join groep g on g.id = tg.groep_id
     where tg.toewijzing_id = t.id),
    array[]::text[]
  ) as groepen,
  coalesce(o.ontbrekende_dieten, array[]::text[]) as ontbrekende_dieten,
  (coalesce(array_length(o.ontbrekende_dieten, 1), 0) = 0) as status_ok
from maaltijd_toewijzing t
join maaltijd m on m.id = t.maaltijd_id
join recept r on r.id = t.recept_id
join toewijzing_eters te on te.toewijzing_id = t.id
left join toewijzing_ontbrekend o on o.toewijzing_id = t.id;

-- ============================================================
-- Functions for Groepen / Activiteiten UI
-- ============================================================

create or replace function toggle_groep_dag_aanwezigheid(p_kamp_id uuid, p_groep_id uuid, p_dag date)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_moment maaltijd_moment;
  v_was_afwezig boolean;
begin
  for v_moment in select unnest(enum_range(null::maaltijd_moment))
  loop
    insert into maaltijd (kamp_id, dag, moment)
    values (p_kamp_id, p_dag, v_moment)
    on conflict (kamp_id, dag, moment) do nothing;
  end loop;

  select exists (
    select 1 from afwezigheid a
    join maaltijd m on m.id = a.maaltijd_id
    where m.kamp_id = p_kamp_id and m.dag = p_dag and a.groep_id = p_groep_id and a.activiteit_id is null
  ) into v_was_afwezig;

  if v_was_afwezig then
    delete from afwezigheid a
    using maaltijd m
    where a.maaltijd_id = m.id
      and m.kamp_id = p_kamp_id and m.dag = p_dag and a.groep_id = p_groep_id and a.activiteit_id is null;
    return false;
  else
    insert into afwezigheid (kamp_id, maaltijd_id, groep_id)
    select p_kamp_id, m.id, p_groep_id
    from maaltijd m
    where m.kamp_id = p_kamp_id and m.dag = p_dag
    on conflict (maaltijd_id, groep_id) do nothing;
    return true;
  end if;
end;
$$;

create or replace function cycle_persoon_dag_aanwezigheid(p_kamp_id uuid, p_persoon_id uuid, p_dag date)
returns text
language plpgsql
security invoker
as $$
declare
  v_moment maaltijd_moment;
  v_huidige boolean;
begin
  for v_moment in select unnest(enum_range(null::maaltijd_moment))
  loop
    insert into maaltijd (kamp_id, dag, moment)
    values (p_kamp_id, p_dag, v_moment)
    on conflict (kamp_id, dag, moment) do nothing;
  end loop;

  select o.aanwezig into v_huidige
  from persoon_aanwezigheid_override o
  join maaltijd m on m.id = o.maaltijd_id
  where o.persoon_id = p_persoon_id and m.kamp_id = p_kamp_id and m.dag = p_dag
  limit 1;

  if v_huidige is null then
    insert into persoon_aanwezigheid_override (kamp_id, maaltijd_id, persoon_id, aanwezig)
    select p_kamp_id, m.id, p_persoon_id, true
    from maaltijd m
    where m.kamp_id = p_kamp_id and m.dag = p_dag
    on conflict (maaltijd_id, persoon_id) do update set aanwezig = true;
    return 'aanwezig';
  elsif v_huidige then
    update persoon_aanwezigheid_override o
    set aanwezig = false
    from maaltijd m
    where o.maaltijd_id = m.id and o.persoon_id = p_persoon_id
      and m.kamp_id = p_kamp_id and m.dag = p_dag;
    return 'afwezig';
  else
    delete from persoon_aanwezigheid_override o
    using maaltijd m
    where o.maaltijd_id = m.id and o.persoon_id = p_persoon_id
      and m.kamp_id = p_kamp_id and m.dag = p_dag;
    return 'volgt_groep';
  end if;
end;
$$;

grant execute on function toggle_groep_dag_aanwezigheid(uuid, uuid, date) to authenticated;
grant execute on function cycle_persoon_dag_aanwezigheid(uuid, uuid, date) to authenticated;

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

-- ============================================================
-- Seed data
-- ============================================================

insert into belgische_feestdag (datum, naam) values
  ('2025-01-01', 'Nieuwjaar'), ('2026-01-01', 'Nieuwjaar'), ('2027-01-01', 'Nieuwjaar'), ('2028-01-01', 'Nieuwjaar'),
  ('2025-05-01', 'Dag van de Arbeid'), ('2026-05-01', 'Dag van de Arbeid'), ('2027-05-01', 'Dag van de Arbeid'), ('2028-05-01', 'Dag van de Arbeid'),
  ('2025-07-21', 'Nationale feestdag'), ('2026-07-21', 'Nationale feestdag'), ('2027-07-21', 'Nationale feestdag'), ('2028-07-21', 'Nationale feestdag'),
  ('2025-08-15', 'O.L.V. Hemelvaart'), ('2026-08-15', 'O.L.V. Hemelvaart'), ('2027-08-15', 'O.L.V. Hemelvaart'), ('2028-08-15', 'O.L.V. Hemelvaart'),
  ('2025-11-01', 'Allerheiligen'), ('2026-11-01', 'Allerheiligen'), ('2027-11-01', 'Allerheiligen'), ('2028-11-01', 'Allerheiligen'),
  ('2025-11-11', 'Wapenstilstand'), ('2026-11-11', 'Wapenstilstand'), ('2027-11-11', 'Wapenstilstand'), ('2028-11-11', 'Wapenstilstand'),
  ('2025-12-25', 'Kerstmis'), ('2026-12-25', 'Kerstmis'), ('2027-12-25', 'Kerstmis'), ('2028-12-25', 'Kerstmis'),
  ('2025-04-21', 'Paasmaandag'), ('2026-04-06', 'Paasmaandag'), ('2027-03-29', 'Paasmaandag'), ('2028-04-17', 'Paasmaandag'),
  ('2025-05-29', 'O.H. Hemelvaart'), ('2026-05-14', 'O.H. Hemelvaart'), ('2027-05-06', 'O.H. Hemelvaart'), ('2028-05-25', 'O.H. Hemelvaart'),
  ('2025-06-09', 'Pinkstermaandag'), ('2026-05-25', 'Pinkstermaandag'), ('2027-05-17', 'Pinkstermaandag'), ('2028-06-05', 'Pinkstermaandag')
on conflict (datum) do nothing;

insert into dieettype (naam, kleur) values
  ('Vegetarisch', '#3f8f5f'),
  ('Glutenvrij', '#d9862f'),
  ('Lactosevrij', '#3d8fb0')
on conflict (naam) do nothing;

-- ============================================================
-- Grants
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function winkel_gesloten(date) to authenticated;
grant execute on function boodschappenlijst_voor(uuid, date) to authenticated;
grant select, insert, update, delete on persoon_aanwezigheid_override to authenticated;
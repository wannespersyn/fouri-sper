-- Recepten module follow-up:
--
-- 1. recept_status drifted on the remote database after init_schema was
--    applied: it was reduced from ('concept', 'klaar',
--    'allergieën-nog-in-te-vullen') to ('concept', 'actief') directly on the
--    remote, without a migration ever recording it. This reconciles the
--    migration history with reality — "allergieën nog in te vullen" is a
--    live-computed warning (see recepten data layer / v_prep_planning), not
--    a stored status, so a 2-value enum is correct going forward.
-- 2. Seeds a handful of leveranciers for the active kamp so the Recepten
--    ingredient picker has real suppliers to choose from — the Leveranciers
--    page itself is still a stub and gets its own CRUD later.

do $$
begin
  if exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'recept_status' and e.enumlabel = 'klaar'
  ) then
    alter table recept alter column status type text using status::text;
    update recept set status = case status
      when 'klaar' then 'actief'
      when 'allergieën-nog-in-te-vullen' then 'concept'
      else status
    end;
    drop type recept_status;
    create type recept_status as enum ('concept', 'actief');
    alter table recept alter column status type recept_status using status::recept_status;
    alter table recept alter column status set default 'concept'::recept_status;
  end if;
end $$;

insert into leverancier (kamp_id, naam, type, contact_info, besteldeadline_dagen)
select k.id, v.naam, v.type, v.contact_info, v.besteldeadline_dagen
from kamp k
cross join (
  values
    ('Colruyt / Collect&Go', 'Droogwaren & zuivel', 'Afhalen in de winkel of online bestellen', 1),
    ('Bakkerij Dumont', 'Brood & gebak', 'Levert elke ochtend om 7u30', 1),
    ('Boerderij ''t Hof', 'Groenten, fruit & eieren', 'Zelf ophalen bij de boer, 2 km van het kampterrein', 0),
    ('Beenhouwerij Vandaele', 'Vlees & charcuterie', 'Minstens 2 dagen op voorhand bestellen', 2),
    ('Makro', 'Grootverpakking', 'Groothandel, 20 km verderop', 1)
) as v(naam, type, contact_info, besteldeadline_dagen)
where k.is_actief
  and not exists (select 1 from leverancier l where l.kamp_id = k.id and l.naam = v.naam);

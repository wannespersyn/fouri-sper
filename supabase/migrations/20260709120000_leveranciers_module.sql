-- Leveranciers module:
--
-- 1. leverancier.type was free text with no fixed set of values. The
--    Leveranciers page needs a dropdown, so this turns it into an enum. The
--    values match exactly what the recepten_module seed already inserted
--    ('Droogwaren & zuivel', 'Brood & gebak', ...) so the five seeded
--    leveranciers keep their category instead of falling back to null.
-- 2. leverancier gets a kleur column, matching the editable-color convention
--    every other visual entity in this app already has (groep, dieettype,
--    activiteit) — the Leveranciers cards use it for the initial-avatar.

create type leverancier_type as enum (
  'droogwaren_zuivel',
  'vlees_charcuterie',
  'groenten_fruit_eieren',
  'brood_gebak',
  'grootverpakking',
  'dranken',
  'diepvries',
  'andere'
);

alter table leverancier
  add column kleur text not null default '#c8763a';

alter table leverancier
  alter column type type leverancier_type using (
    case type
      when 'Droogwaren & zuivel' then 'droogwaren_zuivel'
      when 'Brood & gebak' then 'brood_gebak'
      when 'Groenten, fruit & eieren' then 'groenten_fruit_eieren'
      when 'Vlees & charcuterie' then 'vlees_charcuterie'
      when 'Grootverpakking' then 'grootverpakking'
      else null
    end
  )::leverancier_type;

-- Give the seeded leveranciers a distinct kleur so the demo data matches the
-- design reference's per-supplier avatar colors.
update leverancier set kleur = case naam
  when 'Colruyt / Collect&Go' then '#c8763a'
  when 'Bakkerij Dumont' then '#8a5a3c'
  when 'Boerderij ''t Hof' then '#3f8f5f'
  when 'Beenhouwerij Vandaele' then '#a8434a'
  when 'Makro' then '#3d5a8a'
  else kleur
end
where naam in ('Colruyt / Collect&Go', 'Bakkerij Dumont', 'Boerderij ''t Hof', 'Beenhouwerij Vandaele', 'Makro');

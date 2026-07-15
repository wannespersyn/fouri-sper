-- Streepjes: profiel per persoon (foto + bio).
--
-- Voor de gamification-laag (leaderboards, per-persoon overzicht) krijgt elke
-- streepje_persoon een optionele foto en bio. Foto's gaan naar een publieke
-- storage bucket i.p.v. base64 in de rij, zodat de <img>-tags gewoon de
-- publieke URL kunnen gebruiken — hetzelfde "gedeelde authenticated account"
-- model als de rest van het schema geldt voor het schrijven ernaar.

alter table streepje_persoon add column bio text;
alter table streepje_persoon add column foto_url text;

insert into storage.buckets (id, name, public)
values ('streepje-fotos', 'streepje-fotos', true)
on conflict (id) do nothing;

create policy streepje_fotos_authenticated_schrijven on storage.objects
  for all to authenticated
  using (bucket_id = 'streepje-fotos')
  with check (bucket_id = 'streepje-fotos');

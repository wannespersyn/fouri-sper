-- Sterke drank moet zwaarder meetellen dan een pintje in de gecombineerde
-- totalen (per-persoon totaal, per-dag totaal, "Alle"-leaderboard) — vandaar
-- een instelbaar gewicht per streepje_type i.p.v. elk streepje altijd als 1
-- te tellen. Per-type aantallen (bv. "Sterke: 3") blijven ongewogen.
alter table streepje_type add column gewicht int not null default 1;

update streepje_type set gewicht = 2 where naam = 'Sterke';

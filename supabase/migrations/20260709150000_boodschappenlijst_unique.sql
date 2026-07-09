-- Boodschappen module:
--
-- De Boodschappen-pagina plaatst hooguit één bestelling per leverancier per
-- besteldag. Deze unique constraint maakt een upsert op die combinatie
-- mogelijk (plaatsBestelling in de app-laag) in plaats van dat er dubbele
-- boodschappenlijst-rijen ontstaan als de bestelknop twee keer ingedrukt
-- wordt.
alter table boodschappenlijst
  add constraint boodschappenlijst_kamp_dag_leverancier_key
  unique (kamp_id, besteldag, leverancier_id);

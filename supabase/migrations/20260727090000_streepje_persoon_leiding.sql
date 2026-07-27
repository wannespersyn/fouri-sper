-- Streepjes: "leiding"-vlag op streepje_persoon voor de witte trui.
--
-- De trui-classificaties (geel/groen/bolletjes/wit, zoals in de Tour de
-- France) worden client-side berekend uit de bestaande streepjes-historiek,
-- maar de witte trui (klassement onder leiding) heeft een manier nodig om
-- leiding te onderscheiden van andere kampdeelnemers. Net als favoriet
-- vroeger was, is dit een simpele gedeelde vlag op de rij zelf — iedereen met
-- toegang tot het kamp ziet en kan dezelfde leiding-status aanpassen.
alter table streepje_persoon add column leiding boolean not null default false;

@echo off
docker exec -u postgres restorani_spremnik psql -d RestoraniDB -c "\copy (SELECT r.ime AS \"ime restorana\", r.tip_kuhinje AS \"tip kuhinje\", r.lokacija AS \"lokacija\", r.radno_vrijeme AS \"radno vrijeme\", r.broj_sjedecih_mjesta AS \"broj sjedecih mjesta\", r.prosjecna_ocjena AS \"ocjena\", r.cjenovni_rang AS \"cjenovni rang\", r.mogucnost_dostave AS \"mogucnost dostave\", r.godina_otvaranja AS \"godina otvaranja\", pj.naziv_jela AS \"ime popularnog jela\", pj.cijena AS \"cijena popularnog jela\" FROM restorani r LEFT JOIN popularna_jela pj ON r.id = pj.restoran_id) TO STDOUT DELIMITER ',' CSV QUOTE '\"'" > novi_csv.csv

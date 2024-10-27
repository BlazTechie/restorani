docker exec -u postgres restorani_spremnik psql -d RestoraniDB -c "\
COPY ( \
  SELECT array_to_json(array_agg(row_to_json(t))) \
  FROM ( \
    SELECT r.ime AS \"ime\", \
           r.tip_kuhinje AS \"tip kuhinje\", \
           r.lokacija AS \"lokacija\", \
           r.radno_vrijeme AS \"radno vrijeme\", \
           r.broj_sjedecih_mjesta AS \"broj sjedecih mjesta\", \
           r.prosjecna_ocjena AS \"ocjena\", \
           r.cjenovni_rang AS \"cjenovni rang\", \
           r.mogucnost_dostave AS \"mogucnost dostave\", \
           r.godina_otvaranja AS \"godina otvaranja\", \
           COALESCE(json_agg(json_build_object('ime', pj.naziv_jela, 'cijena', pj.cijena)) FILTER (WHERE pj.naziv_jela IS NOT NULL), '[]') AS \"popularna jela\" \
    FROM restorani r \
    LEFT JOIN popularna_jela pj ON r.id = pj.restoran_id \
    GROUP BY r.id \
  ) t \
) TO STDOUT" > novi_json.json

// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config(); // Ako koristimo .env za konfiguraciju

const { Parser } = require('json2csv')

const app = express();
const PORT = 3000
//const PORT = process.env.PORT || 5000;

//vrijedilo za testni direktorij
//app.use(express.static('public'));
app.use(express.static('restorani_lab'));
app.use(express.static(path.join(__dirname, ''))); // Povezuje se s trenutnim direktorijem



// za povezivanje na possgresql
const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'RestoraniDB',
    password: 'bazepodataka',    
    port: 5432,
});

app.use(cors());
app.use(express.json());

//povezivanje s bazom
pool.connect((err) => {
    if (err) {
        console.error('Povezivanje na bazu nije uspjelo', err);
    } else {
        console.log('Povezano na PostgreSQL bazu podataka');
    }
});

//samo test
/*app.get('/', (req, res) => {
    res.send('Server radi!');
});*/

// Routes za HTML stranice
app.get('/', (req, res) => {
    res.send('Server radi!');

    res.sendFile(path.join(__dirname, 'index.html'));
  });
  
  app.get('/datatable', (req, res) => {
    res.sendFile(path.join(__dirname, 'datatable.html'));
  });

//ruta koja vraca podatke iz baze na temelju filtera
app.get('/api/restorani', async (req, res) => {
    try {
      const { filterText, filterAttribute } = req.query;
  
      // SQl upit za dinamicko filtriranje
      //let query = 'SELECT * FROM restorani'; // samo za restorane ali ne i cijelu bazu
      let query = ` SELECT 
                      r.ime AS ime,
                      r.tip_kuhinje AS tip_kuhinje,
                      r.lokacija AS lokacija,
                      r.radno_vrijeme AS radno_vrijeme,
                      r.broj_sjedecih_mjesta AS broj_sjedecih_mjesta,
                      r.prosjecna_ocjena AS prosjecna_ocjena,
                      r.cjenovni_rang AS cjenovni_rang,
                      r.mogucnost_dostave AS mogucnost_dostave,
                      r.godina_otvaranja AS godina_otvaranja,
                      pj.naziv_jela AS naziv_jela,
                      pj.cijena AS cijena
                     FROM restorani r
                     LEFT JOIN popularna_jela pj ON r.id = pj.restoran_id`;

        const queryParams = [];
  
        if (filterText) {
            if (filterAttribute && filterAttribute !== 'all') {
                //query += ` WHERE ${filterAttribute} ILIKE $1`;
                //queryParams.push(`%${filterText}%`);
                //problem s razlicitim tipom podatka
                switch (filterAttribute) {
                    case 'broj_sjedecih_mjesta':
                    case 'godina_otvaranja':
                       // query += ` WHERE r.${filterAttribute} = $1`; //ovo je za tocnu vrijednost - mozda pozeljno, ali sto ako nznamo tocan iznos
                        query += ` WHERE CAST(r.${filterAttribute} AS TEXT) ILIKE $1`;
                        //queryParams.push(parseInt(filterText)); 
                        queryParams.push(`%${filterText}%`);
                        break;
                    case 'prosjecna_ocjena':
                        //query += ` WHERE r.${filterAttribute} = $1`;
                        query += ` WHERE CAST(r.${filterAttribute} AS TEXT) ILIKE $1`;
                        //queryParams.push(parseFloat(filterText)); 
                        queryParams.push(`%${filterText}%`);
                        break;
                    case 'cijena':
                      //  query += ` WHERE pj.${filterAttribute} = $1`;
                        query += ` WHERE CAST(pj.${filterAttribute} AS TEXT) ILIKE $1`;
                        //queryParams.push(parseFloat(filterText)); 
                        queryParams.push(`%${filterText}%`);
                        break;
                    case 'naziv_jela':
                        query += ` WHERE pj.${filterAttribute} ILIKE $1`;
                        queryParams.push(`%${filterText}%`); // Dodano
                       // queryParams.push(parseFloat(filterText)); 
                        break;
                    case 'mogucnost_dostave':
                        const isDelivery = filterText.toLowerCase() /*=== 'true'`*/;
                        //query += ` WHERE r.${filterAttribute} = $1`;
                        query += ` WHERE CAST(r.${filterAttribute} AS TEXT) ILIKE $1`;
                       // queryParams.push(isDelivery); 
                       queryParams.push(`%${filterText}%`); 
                        break;
                    default:
                        //problem za pj cijena i naziv jela
                        query += ` WHERE r.${filterAttribute} ILIKE $1`;
                        //ili ovo
                        //query += ` WHERE r.${filterAttribute} = $1`;
                        queryParams.push(`%${filterText}%`); 
                }


            } else {
                // flltriranje prema svima atributima - wildcard
                query += `
                    WHERE r.ime ILIKE $1 
                       OR r.tip_kuhinje ILIKE $1 
                       OR r.lokacija ILIKE $1 
                       OR CAST(r.broj_sjedecih_mjesta AS TEXT) ILIKE $1
                       OR CAST(r.prosjecna_ocjena AS TEXT) ILIKE $1
                       OR CAST(r.cjenovni_rang AS TEXT) ILIKE $1
                       OR CAST(r.godina_otvaranja AS TEXT) ILIKE $1
                       OR pj.naziv_jela ILIKE $1
                       OR CAST(pj.cijena AS TEXT) ILIKE $1
                       OR CAST(r.mogucnost_dostave AS TEXT) ILIKE $1
                `;
                queryParams.push(`%${filterText}%`);
            }
        }

      const result = await pool.query(query, /*ovo ovdje treba biti?*/ queryParams);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).send('Greška prilikom dohvaćanja podataka');
    }
  });


//download podataka
//ovdje se ponavljaju podaci kako je prikazano na stranici 
//nije u duhu json-a ali se podaci printaju u json-u
/*app.get('/api/restorani/download/json', async (req, res) => {
    try {
        const { query, queryParams } = buildFilterQuery(req.query);
        const result = await pool.query(query, queryParams);

        res.setHeader('Content-Disposition', 'attachment; filename=filtrirani_restorani.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Greška prilikom preuzimanja JSON datoteke');
    }
});*/


//ovo je dobro rjesenje
app.get('/api/restorani/download/json', async (req, res) => {
    try {
        const { query, queryParams } = buildFilterQuery(req.query);
        const result = await pool.query(query, queryParams);

        // Grupiranje podataka prema restoranima
        const restauranti = {};

        result.rows.forEach(row => {
            const restoranIme = row.ime;

            // Ako restoran već postoji, dodaj jelo u popis
            if (!restauranti[restoranIme]) {
                restauranti[restoranIme] = {
                    ime: row.ime,
                    tip_kuhinje: row.tip_kuhinje,
                    lokacija: row.lokacija,
                    radno_vrijeme: row.radno_vrijeme,
                    broj_sjedecih_mjesta: row.broj_sjedecih_mjesta,
                    prosjecna_ocjena: row.prosjecna_ocjena,
                    cjenovni_rang: row.cjenovni_rang,
                    mogucnost_dostave: row.mogucnost_dostave,
                    godina_otvaranja: row.godina_otvaranja,
                    popularna_jela: []
                };
            }

            // Dodavanje popularnog jela u restoran
            restauranti[restoranIme].popularna_jela.push({
                naziv_jela: row.naziv_jela,
                cijena_jela: row.cijena
            });
        });

        // Pretvaranje objekta u JSON format
        res.setHeader('Content-Disposition', 'attachment; filename=filtrirani_restorani.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(Object.values(restauranti)); // Pretvori objekt u array za JSON odgovor
    } catch (error) {
        console.error(error);
        res.status(500).send('Greška prilikom preuzimanja JSON datoteke');
    }
});


app.get('/api/restorani/download/csv', async (req, res) => {
    try {
        const { query, queryParams } = buildFilterQuery(req.query);
        const result = await pool.query(query, queryParams);

        const json2csvParser = new Parser({ header: false, quote: '' , escapedQuote: ''});
        const csv = json2csvParser.parse(result.rows);

        res.setHeader('Content-Disposition', 'attachment; filename=filtrirani_restorani.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).send('Greška prilikom preuzimanja CSV datoteke');
    }
});


// Funkcija za izradu SQL upita s filterima
function buildFilterQuery({ filterText, filterAttribute }) {
    let query = `SELECT 
                    r.ime AS ime,
                    r.tip_kuhinje AS tip_kuhinje,
                    r.lokacija AS lokacija,
                    r.radno_vrijeme AS radno_vrijeme,
                    r.broj_sjedecih_mjesta AS broj_sjedecih_mjesta,
                    r.prosjecna_ocjena AS prosjecna_ocjena,
                    r.cjenovni_rang AS cjenovni_rang,
                    r.mogucnost_dostave AS mogucnost_dostave,
                    r.godina_otvaranja AS godina_otvaranja,
                    pj.naziv_jela AS naziv_jela,
                    pj.cijena AS cijena
                FROM restorani r
                LEFT JOIN popularna_jela pj ON r.id = pj.restoran_id`;
    
    const queryParams = [];

    if (filterText) {
        if (filterAttribute && filterAttribute !== 'all') {
            switch (filterAttribute) {
                case 'broj_sjedecih_mjesta':
                case 'godina_otvaranja':
                    //query += ` WHERE r.${filterAttribute} = $1`;
                    query += ` WHERE CAST(r.${filterAttribute} AS TEXT) ILIKE $1`;
                    //queryParams.push(parseInt(filterText));
                    queryParams.push(`%${filterText}%`);
                    break;
                case 'prosjecna_ocjena':
                    //query += ` WHERE r.${filterAttribute} = $1`;
                    query += ` WHERE CAST(r.${filterAttribute} AS TEXT) ILIKE $1`;
                   // queryParams.push(parseFloat(filterText));
                    queryParams.push(`%${filterText}%`);
                    break;
               case 'cijena':
                    //query += ` WHERE pj.${filterAttribute} = $1`;
                    query += ` WHERE CAST(pj.${filterAttribute} AS TEXT) ILIKE $1`;
                    //queryParams.push(parseFloat(filterText));
                    queryParams.push(`%${filterText}%`);
                    break;
                case 'naziv_jela':
                    query += ` WHERE pj.${filterAttribute} ILIKE $1`;
                    queryParams.push(`%${filterText}%`); // Dodano
                    //queryParams.push(parseFloat(filterText)); 
                    break;
                case 'mogucnost_dostave':
                    const isDelivery = filterText.toLowerCase() /*=== 'true'`*/;
                    //query += ` WHERE r.${filterAttribute} = $1`;
                    query += ` WHERE CAST(r.${filterAttribute} AS TEXT) ILIKE $1`;
                   // queryParams.push(isDelivery); 
                   queryParams.push(`%${filterText}%`); 
                    break;
                default:
                    query += ` WHERE r.${filterAttribute} ILIKE $1`;
                    queryParams.push(`%${filterText}%`);
            }
        } else {
            query += `
                WHERE r.ime ILIKE $1 
                   OR r.tip_kuhinje ILIKE $1 
                   OR r.lokacija ILIKE $1 
                   OR CAST(r.broj_sjedecih_mjesta AS TEXT) ILIKE $1
                   OR CAST(r.prosjecna_ocjena AS TEXT) ILIKE $1
                   OR CAST(r.cjenovni_rang AS TEXT) ILIKE $1
                   OR CAST(r.godina_otvaranja AS TEXT) ILIKE $1
                   OR pj.naziv_jela ILIKE $1
                   OR CAST(pj.cijena AS TEXT) ILIKE $1
                   OR CAST(r.mogucnost_dostave AS TEXT) ILIKE $1
            `;
            queryParams.push(`%${filterText}%`);
        }
    }

    return { query, queryParams };
}



app.listen(PORT, () => {
    console.log(`Server je pokrenut na http://localhost:${PORT}`);
});

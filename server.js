const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config(); // Ako koristimo .env za konfiguraciju
const { Parser } = require('json2csv')
//dodavanje auth0 autentifikacije
const { auth } = require('express-openid-connect');
const { requiresAuth, checkSession } = require('express-openid-connect');
const fs = require('fs');

const app = express();
const PORT = 3000

const deleteIfExists = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

//vrijedilo za testni direktorij
//app.use(express.static('public'));
app.use(express.static('restorani_lab'));
app.use(express.static(path.join(__dirname, ''))); // Povezuje se s trenutnim direktorijem

const config = {
    authRequired: false,
    auth0Logout: true,
    //secret: 'YOUR_SECRET_KEY', // Promijenite u snažnu tajnu
    secret: '5iyVf5NS_IsvkWdTJrRefwE0dL9sWbwIyjHEzUPMosFPpqo8nYdiGxAVkWBiqGi6',
    baseURL: 'http://localhost:3000',
    clientID: 'j2MwtHRPyD154gsx8nKSkTbL3gfJUDeT',
    issuerBaseURL: 'https://dev-nn1rd7vwq33aatuv.eu.auth0.com'
  };
  
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

//provjera je li korisnik prijavljen, ako nije salji na logout, bolje nego da baca gresku
const ensureLoggedIn = (req, res, next) => {
    if (!req.oidc.isAuthenticated()) {
      return res.redirect('/login');
    }
    next();
  };
  
// za povezivanje na possgresql
const pool = new Pool({
    user: 'postgres', 
    //host: 'db',
    host: 'localhost',
    database: 'RestoraniDB',
    //password: 'mojalozinka',    
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

// Routes za HTML stranice
app.get('/', (req, res) => {
    //res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
    //const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : false;
    //res.render('index', { isUserLoggedIn: req.isAuthenticated() });
    //res.render('index', { isUserLoggedIn: isLoggedIn });
    res.send('Server radi!');
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  // Provjera prijave
app.get('/status', (req, res) => {
    // Provjerava ako je korisnik prijavljen
    const isLoggedIn = req.oidc.isAuthenticated();
    res.json({ isLoggedIn: isLoggedIn });
  });

  app.get('/callback', (req, res) => {
    res.redirect('/'); // Preusmjeravanje korisnika na početnu stranicu nakon prijave
  });
  
  app.get('/datatable', (req, res) => {
    res.sendFile(path.join(__dirname, 'datatable.html'));
  });

app.get('/login', (req, res) => {
    res.redirect('/auth/login');
  });
  
  app.get('/profile', ensureLoggedIn, (req, res) => {
    // Poslužuje profile.html ako je korisnik ulogiran
    res.sendFile(path.join(__dirname, 'profile.html'));
  });

  app.get('/api/profile', ensureLoggedIn, (req, res) => {
    const user = req.oidc.user; // Podaci iz Auth0
   // res.render('profile', { user });
   res.json({
    id: user.sub,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    picture: user.picture,
    nickname: user.nickname,
    locale: user.locale,
    lastUpdated: user.updated_at,
  });
  });

  app.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  });

  /*
  app.get('/logout', (req, res) => {
    // Očisti sesijske podatke samo iz vaše aplikacije
    /*req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Failed to logout');
      }

       // Redirektiraj korisnika na Auth0 logout URL http://localhost:3000/
    // const auth0LogoutUrl = `https://dev-nn1rd7vwq33aatuv.eu.auth0.com/v2/logout?returnTo=http://localhost:3000&client_id=j2MwtHRPyD154gsx8nKSkTbL3gfJUDeT`;

     // Preusmjeravanje na Auth0 logout URL
      // res.redirect(auth0LogoutUrl);
  
      // Redirektiraj korisnika na početnu stranicu ili na login
      //res.redirect('/');
   // });
        req.session = null;
      // Redirektiraj korisnika na Auth0 logout URL http://localhost:3000/
      const auth0LogoutUrl = `https://dev-nn1rd7vwq33aatuv.eu.auth0.com/v2/logout?returnTo=http://localhost:3000&client_id=j2MwtHRPyD154gsx8nKSkTbL3gfJUDeT`;

      // Preusmjeravanje na Auth0 logout URL
        res.redirect(auth0LogoutUrl);
  });*/
  
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

// Ruta za osvježavanje preslika
app.get('/api/restorani/refresh', async (req, res) => {
    console.log("usao u funkciju...");
    try {
        console.log("Početak osvježavanja preslika...");

        const query = `
            SELECT 
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
            LEFT JOIN popularna_jela pj ON r.id = pj.restoran_id;
        `;
        const result = await pool.query(query);
        console.log("SQL upit uspješno izvršen.");

        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
            console.log("Direktorij 'public' ne postoji, kreiram ga...");
            fs.mkdirSync(publicDir);
        }
         // Datoteke za brisanje
         const jsonFilePath = path.join(publicDir, 'restorani.json');
         const csvFilePath = path.join(publicDir, 'restorani.csv');
 
         // Brisanje starih datoteka ako postoje
         deleteIfExists(jsonFilePath);
         deleteIfExists(csvFilePath);
 
        // Generiraj JSON datoteku
        //const jsonFilePath = path.join(__dirname, 'public', 'restorani.json');
          // JSON LD Context koji se koristi samo jednom
         const context = {
            "@context": {
                "@vocab": "https://schema.org/",
                "ime": "name",
                "tip_kuhinje": "servesCuisine",
                "lokacija": "address",
                "radno_vrijeme": "openingHours",
                "prosjecna_ocjena": {
                    "@id": "aggregateRating",
                    "@type": "Number"
                },
                "cjenovni_rang": "priceRange",
                "godina_otvaranja": {
                    "@id": "foundingDate",
                    "@type": "Date"
                },
               /* "popularna_jela": {
                    "@id": "menu",
                   "@type": "Menu"
                },*/
                "popularna_jela": "menu",  // Ovdje nije potrebno koristiti @type: "Menu"
                "naziv_jela": "name",
                "cijena_jela": "price",
                "offers": {
                      "@type": "Offer",
                       "price": "priceCurrency"
                }
            }
        };
        const restauranti = {};
        console.log("Pisanje JSON datoteke...");
        result.rows.forEach(row => {
            const restoranIme = row.ime;
            // Ako restoran već postoji, dodaj jelo u popis
            if (!restauranti[restoranIme]) {
                restauranti[restoranIme] = {
                    //JSON LD
                    /*"@context": {
                        "@vocab": "https://schema.org/",
                        "ime": "name",
                        "tip_kuhinje": "servesCuisine",
                        "lokacija": "address",
                        "radno_vrijeme": "openingHours",
                        /*"broj_sjedecih_mjesta": {
                            "@id": "seatingCapacity",
                            "@type": "Integer"
                        },//
                        "prosjecna_ocjena": {
                            "@id": "aggregateRating",
                            "@type": "Number"
                        },
                        "cjenovni_rang": "priceRange",
                       /* "mogucnost_dostave": {
                            "@id": "offersDelivery",
                            "@type": "Boolean"
                        }, //ne mogu naci u Schema.org
                        "godina_otvaranja": {
                            "@id": "foundingDate",
                            "@type": "Date"
                        },
                        "popularna_jela": "hasMenu",
                        "naziv_jela": "name",
                        "cijena_jela": "price"
                    },*/
                    "@type": "Restaurant",
                    ime: row.ime,
                    tip_kuhinje: row.tip_kuhinje,
                    lokacija: row.lokacija,
                    radno_vrijeme: row.radno_vrijeme,
                    broj_sjedecih_mjesta: row.broj_sjedecih_mjesta,
                    prosjecna_ocjena: row.prosjecna_ocjena,
                    cjenovni_rang: row.cjenovni_rang,
                    mogucnost_dostave: row.mogucnost_dostave,
                    godina_otvaranja: row.godina_otvaranja,
                    //"@type": "Menu",
                    popularna_jela: []
                };
            }

            // Dodavanje popularnog jela u restoran
            restauranti[restoranIme].popularna_jela.push({
                "@type": "MenuItem",
                naziv_jela: row.naziv_jela,
                //"@type": "Offer",
                //cijena_jela: row.cijena
                offers: {
                    "@type": "Offer",
                    cijena_jela: row.cijena, // Cijena jelas
                    priceCurrency: "EUR" // Ovdje dodajemo valutu (EUR u ovom slučaju)
                }
            });
        });
        const json = Object.values(restauranti); // Pretvori objekt u array za JSON odgovor
        // Dodajte kontekst na početak JSON strukture
        const jsonOutput = {
            ...context,
            restorani:Object.values(restauranti) // Pretvori objekt u array za JSON odgovor
        };
        const jsonOutput2 = {
            ...context,
            ...Object.values(restauranti) // Direktno dodajte restaurate kao niz
        };

        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonOutput, null, 2));
        console.log("JSON datoteka uspješno zapisana.");

        console.log("Pisanje CSV datoteke...");
        // Generiraj CSV datoteku
       // const csvFilePath = path.join(__dirname, 'public', 'restorani.csv');
        //const json2csvParser = new Parser();
        const json2csvParser = new Parser({ header: false, quote: '' , escapedQuote: ''});
        const csv = json2csvParser.parse(result.rows);
        fs.writeFileSync(csvFilePath, csv);

        console.log("CSV datoteka uspješno zapisana.");
        res.status(200).send('Preslike uspješno osvježene.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Greška prilikom osvježavanja preslika.');
    }
});

app.listen(PORT, () => {
    console.log(`Server je pokrenut na http://localhost:${PORT}`);
});

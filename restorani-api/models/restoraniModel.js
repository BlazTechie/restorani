const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;


const pool = new Pool({
    user: 'postgres',
    //host: 'localhost',
    host: 'db',
    database: 'RestoraniDB',
    //password: 'bazepodataka',
    password: 'mojalozinka',
    port: 5432,
   // port: 5435,

});


/*const getAllRestorani = async () => {
    const result = await pool.query('SELECT * FROM restorani');
    return result.rows;
};*/
//svi podaci- ne samo restorani!!
const getAllRestorani = async () => {
    const result = await pool.query(
        `SELECT 
            r.id AS restoran_id,
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
        LEFT JOIN popularna_jela pj ON r.id = pj.restoran_id`
    );
    //u JSON
    const restoraniMap = new Map();

    for (const row of result.rows) {
        if (!restoraniMap.has(row.restoran_id)) {
            restoraniMap.set(row.restoran_id, {
                restoran_id: row.restoran_id,
                ime: row.ime,
                tip_kuhinje: row.tip_kuhinje,
                lokacija: row.lokacija,
                radno_vrijeme: row.radno_vrijeme,
                broj_sjedecih_mjesta: row.broj_sjedecih_mjesta,
                prosjecna_ocjena: row.prosjecna_ocjena,
                cjenovni_rang: row.cjenovni_rang,
                mogucnost_dostave: row.mogucnost_dostave,
                godina_otvaranja: row.godina_otvaranja,
                popularna_jela: [],
            });
        }

        if (row.naziv_jela) {
            restoraniMap.get(row.restoran_id).popularna_jela.push({
                naziv_jela: row.naziv_jela,
                cijena: row.cijena,
            });
        }
    }
    const sortedRestorani = Array.from(restoraniMap.values()).sort((a, b) => a.restoran_id - b.restoran_id);

    //return Array.from(restoraniMap.values());
    return sortedRestorani;
};


const getRestoranById = async (id) => {
    try {
        const result = await pool.query('SELECT * FROM restorani WHERE id = $1', [id]);
        return result.rows[0];
    } catch (error) {
        throw new Error('Greska prilikom dohvacanja restorana: ' + error.message);
    }
};

const getRestoraniByKuhinja = async (kuhinja) => {
    try {
        const result = await pool.query('SELECT * FROM restorani WHERE tip_kuhinje = $1', [kuhinja]);
        return result.rows;
    } catch (error) {
        throw new Error('Greska prilikom dohvacanja restorana: ' + error.message);
    }
};

//dodavanje ovog restorana
const createRestoran = async (restoran) => {
    const {
        ime,
        tip_kuhinje,
        lokacija,
        radno_vrijeme,
        broj_sjedecih_mjesta,
        prosjecna_ocjena,
        cjenovni_rang,
        mogucnost_dostave,
    } = restoran;

    const result = await pool.query(
        `INSERT INTO restorani 
         (ime, tip_kuhinje, lokacija, radno_vrijeme, broj_sjedecih_mjesta, prosjecna_ocjena, cjenovni_rang, mogucnost_dostave)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [ime, tip_kuhinje, lokacija, radno_vrijeme, broj_sjedecih_mjesta, prosjecna_ocjena, cjenovni_rang, mogucnost_dostave]
    );
    return result.rows[0];
};




// Delete restorana bez reseta ID
/*const deleteRestoran = async (id) => {
    await pool.query('DELETE FROM restorani WHERE id = $1', [id]);
    return true;
};*/
/*
const deleteRestoran = async (id) => {
    const result = await pool.query('DELETE FROM restorani WHERE id = $1', [id]);
    return result.rowCount > 0; // Vraća true ako je barem jedan redak obrisan
};*/

// Delete restoran by ID - s resetom id-eva
const deleteRestoran = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start transkacije
        // Delete 
        const deleteResult = await client.query('DELETE FROM restorani WHERE id = $1 RETURNING id', [id]);

        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK'); // Rollback ako s enista nije napravilo
            return false;
        }

        // Reset 
        await client.query(`
            SELECT SETVAL('restorani_id_seq', COALESCE(MAX(id), 1)) 
            FROM restorani
        `);

        await client.query('COMMIT'); // Commit 
        return true;
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback ako error
        throw error;
    } finally {
        client.release(); 
    }
};


const getAllPopularnaJela = async () => {
    const result = await pool.query(
        `SELECT 
            *
        FROM popularna_jela 
        ORDER BY restoran_id
        `
    );

    return result.rows;
};

// Funkcija koja dohvaća restorane prema mogućnosti dostave
const getRestoraniByDostava = async (dostava) => {
    try {
        //console.log('Dostava parametar u modelu:', dostava);  // Logiraj vrijednost koja dolazi u model

        const result = await pool.query(
            `SELECT * 
             FROM restorani 
             WHERE mogucnost_dostave = $1`,
            [dostava]
        );
        //console.log('Rezultat upita:', result.rows);  // Logiraj rezultat upita

        return result.rows;
    } catch (error) {
        throw new Error('Database query error');
    }
};


const getRestoraniByCjenovniRang = async (rang) => {
    try {
        //console.log('Cjenovni rang u modelu:', rang);  // Logiranje cjenovnog ranga

        const result = await pool.query(
            `SELECT * FROM restorani WHERE cjenovni_rang = $1`,  // Upit za filtriranje restorana po cjenovnom rangu
            [rang]  // Cjenovni rang se prosljeđuje kao parametar
        );
        
        //console.log('Rezultat upita:', result.rows);  // Logiranje rezultata upita
        
        return result.rows;
    } catch (error) {
        console.error('Greska u upitu:', error);
        throw new Error('Database query error: ' + error.message);
    }
};



const updateRestoranById = async (id, noviPodaci) => {
    try {
        const {
            ime,
            tip_kuhinje,
            lokacija,
            radno_vrijeme,
            broj_sjedecih_mjesta,
            prosjecna_ocjena,
            cjenovni_rang,
            mogucnost_dostave,
        } = noviPodaci;

        const result = await pool.query(
            `UPDATE restorani
             SET ime = $1, tip_kuhinje = $2, lokacija = $3, radno_vrijeme = $4, broj_sjedecih_mjesta = $5,
                 prosjecna_ocjena = $6, cjenovni_rang = $7, mogucnost_dostave = $8
             WHERE id = $9
             RETURNING *`,
            [
                ime,
                tip_kuhinje,
                lokacija,
                radno_vrijeme,
                broj_sjedecih_mjesta,
                prosjecna_ocjena,
                cjenovni_rang,
                mogucnost_dostave,
                id,
            ]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Greska u upitu za azuriranje restorana:', error);
        throw new Error('Database query error: ' + error.message);
    }
};

//nekad radi nekad ne?
/*
const getOpenAPISpec = async () => {
    //const openapiPath = path.join(__dirname, '../openapi.json');
    const openapiPath = path.resolve(__dirname, '../openapi.json'); // Apsolutna putanja
    console.log('OpenAPI Path:', openapiPath);

    return new Promise((resolve, reject) => {
        fs.readFile(openapiPath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};
*/



const getOpenAPISpec = async () => {
    //console.log('Aj u modelu  sam');

    const openapiPath = path.resolve(__dirname, '../openapi.json');
    //console.log('OpenAPI Path:', openapiPath);

    try {
        // Provjeri da li datoteka postoji koristeći fs.promises
        await fs.access(openapiPath);  // Provjera
        const data = await fs.readFile(openapiPath, 'utf8');
        //console.log('Podaci iz openapi.json:', data);  
        return data;
    } catch (err) {
        console.error('Greska pri citanju openapi.json:', err);
        throw err;
    }
};



module.exports = {
    getAllRestorani,
    getRestoranById,
    getRestoraniByKuhinja,
    createRestoran,
    deleteRestoran,
    getAllPopularnaJela,
    getRestoraniByDostava,
    getRestoraniByCjenovniRang,
    updateRestoranById,
    getOpenAPISpec,
};

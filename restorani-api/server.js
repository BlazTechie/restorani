// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config(); // Ako koristimo .env za konfiguraciju
const fs = require('fs');
const restoraniRoutes = require('./routes/restoraniRoutes');


const { Parser } = require('json2csv')

const app = express();
const PORT = 3000
//const PORT = process.env.PORT || 5000;

//vrijedilo za testni direktorij
//app.use(express.static('public'));

//app.use(express.static('restorani_lab'));
//app.use(express.static(path.join(__dirname, ''))); // Povezuje se s trenutnim direktorijem


//Middleware
app.use(bodyParser.json());
// Routes
app.use('/api/restorani', restoraniRoutes);


// za povezivanje na possgresql
const pool = new Pool({
    user: 'postgres', 
    //host: 'localhost', // Promjena s 'db' na 'localhost' za lokalno testiranje
    host: 'db',
    database: 'RestoraniDB',
    password: 'mojalozinka',   
    //password: 'bazepodataka',    
    port: 5432,
    //port: 5435,

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
/*app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
  
app.get('/datatable', (req, res) => {
    res.sendFile(path.join(__dirname, 'datatable.html'));
});
*/

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});




app.listen(PORT, () => {
    console.log(`Dobar Server je pokrenut na http://localhost:${PORT}`);
});

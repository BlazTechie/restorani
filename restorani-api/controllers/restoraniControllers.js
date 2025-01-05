const restoraniModel = require('../models/restoraniModel');

// Fetch svih restorana
const getRestorani = async (req, res) => {
    try {
        const restorani = await restoraniModel.getAllRestorani();
        //res.status(200).json({ success: true, data: restorani });

          // Provjera ako restorani postoje
          if (restorani.length === 0) {
            return res.status(404).json({
                status: "Not Found",
                message: "List of restaurants not found",
                response: null
            });
        }

          res.status(200).json({
            status: "OK",
            message: "Fetched restaurant list",
            response: {
                data: restorani
            }
        });
    } catch (error) {
       // res.status(500).json({ success: false, message: error.message });
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};

const getRestoranById = async (req, res) => {
    const { id } = req.params;
    try {
        const restoran = await restoraniModel.getRestoranById(id);
        if (restoran) {
            //res.status(200).json({ success: true, data: restoran });
            res.status(200).json({
                status: "OK",
                message: "Fetched restaurant by ID",
                response: {
                    data: restoran
                }
            });
        } else {
            //res.status(404).json({ success: false, message: 'Restoran nije pronađen' });
            res.status(404).json({
                status: "Not Found",
                message: "Restaurant not found",
                response: null
            });
        }
    } catch (error) {
        //res.status(500).json({ success: false, message: error.message });
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};

// Fetch po kuhinji
const getRestoraniByKuhinja = async (req, res) => {
    const { kuhinja } = req.params;
    try {
        const restorani = await restoraniModel.getRestoraniByKuhinja(kuhinja);
        //res.status(200).json({ success: true, data: restorani });
        if (restorani.length > 0) {
            return res.status(200).json({
                status: "OK",
                message: `Fetched restaurants for cuisine type: ${kuhinja}`,
                response: {
                    data: restorani
                }
            });
        }
        
        return res.status(404).json({
            status: "Not Found",
            message: `No restaurants found for cuisine type: ${kuhinja}`,
            response: null
        });
    } catch (error) {
        //res.status(500).json({ success: false, message: error.message });
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};

// Dodavanje restorana
const createRestoran = async (req, res) => {
    try {
        const noviRestoran = await restoraniModel.createRestoran(req.body);
        //res.status(201).json({ success: true, data: noviRestoran });
        res.status(201).json({
            status: "OK",
            message: "Successfully created new restaurant",
            response: {
                data: noviRestoran
            }
        });
    } catch (error) {
       //res.status(500).json({ success: false, message: error.message });
       console.error('Greska prilikom stvaranja restorana:', error); // Dodajte ovaj redak
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};

// Delete 
const deleteRestoran = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await restoraniModel.deleteRestoran(id);
        if (deleted) {
           // res.status(200).json({ success: true, message: 'Restoran uspješno obrisan' });
            res.status(200).json({
                status: "OK",
                message: "Restaurant successfully deleted",
                response: null
            });
        } else {
            //res.status(404).json({ success: false, message: 'Restoran nije pronađen' });
            res.status(404).json({
                status: "Not Found",
                message: "Restaurant not found",
                response: null
            });
        }
    } catch (error) {
        //res.status(500).json({ success: false, message: error.message });
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};

const getAllPopularnaJela = async (req, res) => {
    try {
        const popularnaJela = await restoraniModel.getAllPopularnaJela();
        //res.json(popularnaJela);

        if (popularnaJela.length > 0) {
            return res.status(200).json({
                status: "OK",
                message: `Fetched popular meals`,
                response: {
                    data: popularnaJela
                }
            });
        }
        
        return res.status(404).json({
            status: "Not Found",
            message: `No popular meals found`,
            response: null
        });
    } catch (error) {
        console.error('Greska pri dohvacanju popularnih jela:', error);
        //res.status(500).json({ error: 'Greška pri dohvaćanju popularnih jela' });
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};

// Kontroler za dohvat restorana prema mogućnosti dostave
const getRestoraniByDostava = async (req, res) => {
    try {
        const { status } = req.params;

        console.log('Dostava status:', status); 

        const dostava = status === 'true';
        console.log('Pretvoreni dostava:', dostava); 


        const restorani = await restoraniModel.getRestoraniByDostava(dostava);

        if (restorani.length === 0) {
            return res.status(404).json({
                status: "Not Found",
                message: "Restaurants not found",
                response: null
            });
        }

        res.status(200).json({
            status: "OK",
            message: `Fetched restaurants with delivery: ${status}`,
            response: {
                data: restorani
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};


const getRestoraniByCjenovniRang = async (req, res) => {
    try {
        const { rang } = req.params;  // Dohvati cjenovni rang iz parametara
        //console.log('Dohvacen cjenovni rang:', rang);  
        
        const restorani = await restoraniModel.getRestoraniByCjenovniRang(rang);  

        if (restorani.length === 0) {
            return res.status(404).json({
                status: "Not Found",
                message: "No restaurants found in the specified price range",
                response: null
            });
        }

        res.status(200).json({
            status: "OK",
            message: `Fetched restaurants with price range: ${rang}`,
            response: {
                data: restorani
            }
        });
    } catch (error) {
        console.error('Greska u kontroleru:', error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};


const updateRestoranById = async (req, res) => {
    try {
        const { id } = req.params;
        const noviPodaci = req.body;

        console.log('Azuriranje restorana s ID-jem:', id, 'Novi podaci:', noviPodaci);

        const updatedRestoran = await restoraniModel.updateRestoranById(id, noviPodaci);

        if (!updatedRestoran) {
            return res.status(404).json({
                status: "Not Found",
                message: "Restaurant not found",
                response: null
            });
        }

        res.status(200).json({
            status: "OK",
            message: `Restaurant with ID ${id} updated successfully`,
            response: {
                data: updatedRestoran
            }
        });
    } catch (error) {
        console.error('Greska u kontroleru za azuriranje restorana:', error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            response: null
        });
    }
};


const getOpenAPISpec = async (req, res) => {
    try {
       // console.log('Aj u kontroleru sam');

        const spec = await restoraniModel.getOpenAPISpec();
        const parsedSpec = JSON.parse(spec); // Parsiraj u JSON
       // res.json(parsedSpec); 
        res.status(200).json({
            status: "OK",
            message: `OpenAPi specification fetched successfully`,
            response: {
                data: parsedSpec
            }
        });
    } catch (error) {
        console.error('Error fetching OpenAPI specification:', error.message);
        res.status(500).json({ error: 'Cannot load OpenAPI specification' });
    }
};



module.exports = {
    getRestorani,
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

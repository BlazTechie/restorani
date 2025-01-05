const express = require('express');
const restoraniController = require('../controllers/restoraniControllers');

const router = express.Router();


// Route
router.get('/openapi', restoraniController.getOpenAPISpec);
router.get('/popularnajela', restoraniController.getAllPopularnaJela);
router.get('/', restoraniController.getRestorani);
router.get('/:id', restoraniController.getRestoranById);
router.get('/kuhinja/:kuhinja', restoraniController.getRestoraniByKuhinja);
router.post('/', restoraniController.createRestoran);
router.delete('/:id', restoraniController.deleteRestoran);
router.get('/dostava/:status', restoraniController.getRestoraniByDostava);
router.get('/cjenovni-rang/:rang', restoraniController.getRestoraniByCjenovniRang);
router.put('/:id', restoraniController.updateRestoranById);

module.exports = router;

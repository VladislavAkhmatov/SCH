const express = require('express')
const parentController = require('../controllers/parentController')
const router = express.Router()

router.get('/', parentController.getAllParent)
router.get('/:id', parentController.getParentById)
router.post('/', parentController.createParent)
router.put('/:id', parentController.updateParent)
router.delete('/:id', parentController.deleteParent)

module.exports = router

const express = require('express')
const teacherController = require('../controllers/teacherController')
const router = express.Router()

router.get('/', teacherController.getAllTeacher)
router.get('/:id', teacherController.getTeacherById)
router.post('/', teacherController.createTeacher)
router.put('/:id', teacherController.updateTeacher)
router.delete('/:id', teacherController.deleteTeacher)


module.exports = router

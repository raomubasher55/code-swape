import { Router } from 'express'
import { FilesController } from '../controllers/files.controller.js'

const router = Router()
const filesController = new FilesController()

/**
 * Files API Routes
 * Using class-based controller with dependency injection
 */

// List files and folders
router.get('/', filesController.listFiles)

// Read file content
router.get('/content', filesController.readFile)

// Save file content
router.post('/content', filesController.saveFile)

// Create new file
router.post('/create-file', filesController.createFile)

// Create new folder
router.post('/create-folder', filesController.createFolder)

// Rename file or folder
router.post('/rename', filesController.rename)

// Delete file or folder
router.delete('/', filesController.delete)

export default router

import { Router } from 'express'
import * as filesController from '../controllers/files.controller.js'

const router = Router()

/**
 * Files API Routes
 * All business logic is in controllers and services
 */

// List files and folders
router.get('/', filesController.listFilesHandler)

// Read file content
router.get('/content', filesController.readFileHandler)

// Save file content
router.post('/content', filesController.saveFileHandler)

// Create new file
router.post('/create-file', filesController.createFileHandler)

// Create new folder
router.post('/create-folder', filesController.createFolderHandler)

// Rename file or folder
router.post('/rename', filesController.renameHandler)

// Delete file or folder
router.delete('/', filesController.deleteHandler)

export default router

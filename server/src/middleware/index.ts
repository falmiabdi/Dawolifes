import { Router } from 'express'
import { errorHandler, notFoundHandler } from './error.js'

const router = Router()

// This file aggregates all middleware
export { errorHandler, notFoundHandler }

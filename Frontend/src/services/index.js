/**
 * Services Index - Central export point for all services
 * 
 * This allows clean imports like:
 * import { filesService, foldersService } from '../services';
 */

export { authService } from './auth.service';
export { filesService } from './files.service';
export { foldersService } from './folders.service';
export { trashService } from './trash.service';
export { sharesService } from './shares.service';
export { feedbackService } from './feedback.service';
export { default as searchService } from './search.service';

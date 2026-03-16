// ================================================
// CRUD ROUTES - REFACTORED VERSION
// ================================================
// 
// Este archivo ha sido refactorizado para usar la nueva arquitectura.
// La implementación original de 594 líneas ha sido separada en:
// - AcademicService: Lógica académica (áreas, asignaturas, simulacros)
// - StudentService: Operaciones de estudiantes y ranking
// - DynamicRepository: Acceso a datos abstraccionado
// 
// Para compatibilidad, las rutas legacy siguen funcionando pero ahora
// usan los nuevos servicios internamente.
// 
// Migración recomendada:
// - Usar /api/v2/academic/* para operaciones académicas
// - Usar /api/v2/students/* para operaciones de estudiantes
// - Usar /api/v2/crud/* para CRUD genérico
// 
// ================================================

import { Router } from 'express';
// Legacy CRUD routes have been migrated to modular routes under academic/, students/, system/
export default Router();
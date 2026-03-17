import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../../shared/config/swagger';
import { authenticate } from '../../shared/middleware/authMiddleware';
import userRoutes from './auth/auth.routes';
import appVersionRoutes from './system/version.routes';
import scoringRoutes from './scoring/scoring.routes';
import academicRoutes from './academic/academic.routes';
import studentRoutes from './students/student.routes';
import systemRoutes from './system/system.routes';
import mediaRoutes from './media/media.routes';
import pdfRoutes from './pdf/pdf.routes';
import qualifierRoute from './qualifier/qualifier.routes';
import timeRoute from './time/time_zone';
import crudMobile from './crud_app';
import progressRoute from './progress/progress.route';

export const registerHttpRoutes = (app: Express): void => {
    // ────────────── Swagger Documentation ──────────────
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Public Routes (no authentication required)
    app.use('/api/auth', userRoutes);
    app.use('/api/version', appVersionRoutes);
    app.use('/api/scoring', scoringRoutes);

    // Protected Routes (require authentication)
    app.use('/api/academic', authenticate, academicRoutes);
    app.use('/api/students', authenticate, studentRoutes);
    app.use('/api/system', authenticate, systemRoutes);
    app.use('/api/media', authenticate, mediaRoutes);

    // Specific API Routes (protected)
    app.use('/api/pdf', authenticate, pdfRoutes);
    app.use('/api/qualifier', authenticate, qualifierRoute);
    app.use('/api/time', authenticate, timeRoute);

    // Legacy routes (protected for compatibility)
    app.use('/simulacro', crudMobile);
    app.use('/progress-app', authenticate, progressRoute);
};

export const printStartupBanner = (port: string): void => {
    console.log('==============================================================');
    console.log('\nPublic Routes (No Auth):');
    console.log('  Auth:      /api/auth/*      - Login, Register, Logout');
    console.log('  Version:   /api/version     - App version (GET, POST, PUT)');

    console.log('\nProtected Routes (Auth Required):');
    console.log('  Academic:  /api/academic/*  - Areas, subjects, simulacros');
    console.log('  Students:  /api/students/*  - Student management & ranking');
    console.log('  System:    /api/system/*    - System utilities & CRUD');
    console.log('  Media:     /api/media/*     - Images, files, PDFs');
    console.log('  PDF:       /api/pdf/*       - PDF operations');
    console.log('  Qualifier: /api/qualifier/* - Qualifier operations');
    console.log('  Time:      /api/time/*      - Time zone operations');

    console.log('\nLegacy Routes (Protected):');
    console.log('  Simulacro: /simulacro/*     - Mobile CRUD operations');
    console.log('  Progress:  /progress-app/*  - Progress tracking');
    console.log('==============================================================');

    console.log(`\nWebSocket endpoint: ws://localhost:${port}/ws/notifications`);
    console.log(`Swagger UI available at http://localhost:${port}/api/docs`,);
    console.log(`API listening at http://localhost:${port}/api\n`);
};

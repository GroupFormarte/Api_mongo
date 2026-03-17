import { Router } from 'express';
import { getCurrentTime, getTimeLeft } from './time.controller';

const router = Router();

router
    .get('/current-time', getCurrentTime)
    .post('/time-left', getTimeLeft)

export default router;

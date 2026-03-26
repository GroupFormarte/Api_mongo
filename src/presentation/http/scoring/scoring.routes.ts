import { Router } from 'express';
import {
  calcularBatchSaber11,
  calcularBatchUnal,
  calcularUdea,
  guardarRespuestasSaber11,
  recalibrarScoring,
} from './scoring.controller';

const router = Router();

router
  .post('/udea/calcular', calcularUdea)
  .post('/unal/calcular-batch', calcularBatchUnal)
  .post('/saber11/calcular-batch', calcularBatchSaber11)
  .post('/saber11/guardar-respuestas', guardarRespuestasSaber11)
  .post('/recalibrar', recalibrarScoring)

export default router;
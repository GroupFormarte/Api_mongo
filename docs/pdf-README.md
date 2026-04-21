# Generador de PDFs de Resultados de Estudiantes

Este módulo contiene la lógica para generar reportes PDF de resultados de estudiantes, siguiendo el diseño proporcionado (incluyendo tablas y gráficos circulares por área).

## Dependencias necesarias
- `pdfkit`: Para la generación de PDFs.
- `chartjs-node-canvas`: Para la generación de gráficos circulares (pie charts).
- `fs` y `path`: Para manejo de archivos.

Instala las dependencias con:

```
npm install pdfkit chartjs-node-canvas
```

## Uso
La función principal es `generatePDF`, que recibe un array de resultados de estudiantes y la ruta de salida del PDF.

```typescript
import { generatePDF } from './pdfGenerator';
await generatePDF(results, 'ruta/salida.pdf');
```

## Integración
La ruta `/report/pdf` en el API recibe un array de resultados en el campo `results` y retorna el PDF generado.

## Notas
- El logo debe estar disponible en `src/utils/pdf/podium_logo.png`.
- El archivo PDF se genera temporalmente y se elimina tras ser enviado al cliente.
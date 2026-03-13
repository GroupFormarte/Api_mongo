import { AreaUnal } from "../../../domain/interfaces/unalInterface";

export function mapAsignaturaToAreaUnal(asignatura: string): AreaUnal | null {
  const a = asignatura
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (a.includes('matematica') || a.includes('razonamiento logico') ||
    a.includes('razonamiento matematico')) return 'Matemáticas';

  if (a.includes('ciencias naturales') || a.includes('biologia') ||
    a.includes('fisica') || a.includes('quimica')) return 'Ciencias Naturales';

  if (a.includes('ciencias sociales') || a.includes('competencia ciudadana') ||
    a.includes('sociales')) return 'Ciencias Sociales';

  if (a.includes('lectura') || a.includes('competencia lectora') ||
    a.includes('analisis textual') || a.includes('analisis de texto')) return 'Análisis Textual';

  if (a.includes('analisis de la imagen')) return 'Análisis de la Imagen';

  return null;
}

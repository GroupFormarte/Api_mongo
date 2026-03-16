import { AreaSaber11 } from "../../domain/interfaces/saber.interfaces";

export function mapAsignaturaToAreaIcfes(asignatura: string): AreaSaber11 | null {
  const a = asignatura
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (a.includes('lectura') || a.includes('competencia lectora') ||
    a.includes('analisis textual')) return 'Lectura Crítica';

  if (a.includes('matematica') || a.includes('razonamiento logico')) return 'Matemáticas';

  if (a.includes('ciencias naturales') || a.includes('biologia') ||
    a.includes('fisica') || a.includes('quimica')) return 'Ciencias Naturales';

  if (a.includes('ciencias sociales') || a.includes('competencia ciudadana'))
    return 'Sociales y Ciudadanas';

  if (a.includes('ingles') || a.includes('english')) return 'Inglés';

  return null;
}
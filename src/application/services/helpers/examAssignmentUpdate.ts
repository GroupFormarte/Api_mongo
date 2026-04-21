import { PuntajeArea } from "../../../domain/interfaces/saber.interfaces";
import { PuntajeAreaUdea } from "../../../domain/interfaces/udea.interfaces";
import { PuntajeAreaUnal } from "../../../domain/interfaces/unal-interfaces";

type AreaScore =
  | Pick<PuntajeArea, "area" | "puntaje">
  | Pick<PuntajeAreaUdea, "area" | "puntaje">
  | Pick<PuntajeAreaUnal, "area" | "puntaje">;

type AreaNameMap = Record<string, string[]>;

const defaultScoreField = "score";

export function buildExamAssignmentUpdate(
  score: number,
  areas: AreaScore[],
  idSimulacro: string | null,
  areaNameMap: AreaNameMap,
  scoreField: string = defaultScoreField,
): {
  $set: Record<string, number | string>;
  arrayFilters: Array<Record<string, unknown>>;
} {
  const $set: Record<string, number | string> = {
    [`examenes_asignados.$[exam].${scoreField}`]: score,
  };

  const arrayFilters: Array<Record<string, unknown>> = [
    { "exam.id_simulacro": idSimulacro },
  ];

  areas.forEach((areaScore, index) => {
    const materiaKey = `mat${index}`;
    const candidates = areaNameMap[areaScore.area] ?? [areaScore.area];

    $set[`examenes_asignados.$[exam].materias.$[${materiaKey}].porcentaje`] =
      areaScore.puntaje.toFixed(2);

    arrayFilters.push({
      [`${materiaKey}.name`]: { $in: candidates },
    });
  });

  return { $set, arrayFilters };
}

export const icfesAreaNameMap: AreaNameMap = {
  "Lectura Crítica": ["Lectura Crítica", "Competencia Lectora", "Análisis Textual"],
  "Matemáticas": ["Matemáticas", "Razonamiento Lógico"],
  "Ciencias Naturales": ["Ciencias Naturales", "Biologia", "Biológico", "Biologico", "Química", "Quimica", "Física", "Fisica"],
  "Sociales y Ciudadanas": ["Sociales y Ciudadanas", "Ciencias Sociales", "Competencia Ciudadana"],
  "Inglés": ["Inglés", "Ingles", "English"],
};

export const udeaAreaNameMap: AreaNameMap = {
  "Razonamiento Lógico": ["Razonamiento Lógico"],
  "Competencia Lectora": ["Competencia Lectora"],
};

export const unalAreaNameMap: AreaNameMap = {
  "Matemáticas": ["Matemáticas"],
  "Ciencias Naturales": ["Ciencias Naturales"],
  "Ciencias Sociales": ["Ciencias Sociales"],
  "Análisis Textual": ["Análisis Textual"],
  "Análisis de la Imagen": ["Análisis de la Imagen"],
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type AreaUdea = "razonamiento" | "lectura";

// Estructura que Flutter manda (subjects ya calculados)
export interface SubjectFromFlutter {
  name: string;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface AssignedExamFromFlutter {
  idSimulacro: string;
  score?: number;
  position?: number;
  materias?: SubjectFromFlutter[]; // puede venir como materias
  subjects?: SubjectFromFlutter[]; // o como subjects
}

export interface StudentFromFlutter {
  id: string;
  id_estudiante?: string;
  studentId?: string;
  name?: string;
  presento?: boolean; //  Flutter lo calcula desde sessionResponses
  examenes_asignados?: AssignedExamFromFlutter[];
  assignedExams?: AssignedExamFromFlutter[];
}

export interface PuntajeAreaUdea {
  area: string; // nombre real del área (ej: "Competencia Lectora")
  puntaje: number; // compatible con ApiScoringAreaResult de Flutter
  correctas: number; // ← era 'aciertos', renombrado para unificar con Saber
  incorrectas: number;
  total: number;
  // campos extra UdeA
  media: number;
  sd: number;
}

export interface ResultadoUdea {
  idEstudiante: string;
  nombre?: string;
  areas: PuntajeAreaUdea[];
  puntajeGlobal: number;
  position: number;
  fechaCalculo: Date;
}

export interface ResultadoGrupoUdea {
  idSimulacro: string;
  resultados: ResultadoUdea[];
  fechaCalculo: Date;
}
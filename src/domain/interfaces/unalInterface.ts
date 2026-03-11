export type AreaUnal = 'matematicas' | 'ciencias' | 'sociales' | 'lectura' | 'ingles';

export interface PuntajeAreaUnal {
  area: AreaUnal;
  puntaje: number;      // 0–15 (escala UNAL por área)
  correctas: number;
  incorrectas: number;
  total: number;
}

export interface ResultadoUnal {
  idEstudiante: string;
  score: number;           // 0–1000
  position: number;
  totalStudents: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswered: number;
  areas: PuntajeAreaUnal[];
}
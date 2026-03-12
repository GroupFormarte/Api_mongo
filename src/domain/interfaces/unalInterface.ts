export type AreaUnal = 'matematicas' | 'ciencias' | 'sociales' | 'lectura' | 'ingles';

export interface PuntajeAreaUnal {
  area: AreaUnal;
  puntaje: number;
  scoreBruto: number;
  correctas: number;
  incorrectas: number;
  total: number;
}

export interface ResultadoUnal {
  idEstudiante: string;
  score: number;
  position: number;
  totalStudents: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswered: number;
  areas: PuntajeAreaUnal[];
}
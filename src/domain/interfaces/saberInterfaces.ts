export type AreaSaber11 = 'lectura' | 'matematicas' | 'ciencias' | 'sociales' | 'ingles';

export interface ResultadoPregunta {
  idPregunta: string;
  asignatura: string;
  respuesta: boolean;
  dateCreated: string;
}

export interface ContadorPregunta {
  _id: string;
  difficulty: number;
  discrimination: number;
  weight: number;
  is_calibrated: boolean;
  total_answers: number;
  status?: string;
}

export interface PuntajeArea {
  area: AreaSaber11;
  puntaje: number;       // 0–100
  correctas: number;
  incorrectas: number;
  total: number;
}

export interface ResultadoSemiIRT {
  idEstudiante: string;
  idInstituto: string;
  puntajeGlobal: number;   // 0–500
  areas: PuntajeArea[];
  fechaCalculo: Date;
  sesionesDetectadas: number;
}
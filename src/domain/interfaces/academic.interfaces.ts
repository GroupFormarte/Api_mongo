export interface AreaWithQuestions {
  _id: string;
  value: string;
  childrents: string[];
  [key: string]: any;
}

export interface SubjectWithQuestions {
  _id: string;
  value: string;
  childrents: string[];
  [key: string]: any;
}

export interface SimulacroData {
  data: string[];
}

export interface QuestionsByTypeAndArea {
  pregunta: string;
  cod: string;
  id: string;
  area: string;
}

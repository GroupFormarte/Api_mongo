import { AreaWithQuestions, SubjectWithQuestions, SimulacroData, QuestionsByTypeAndArea } from '../../domain/interfaces/academic.interfaces';
import { DynamicRepository } from '../../infrastructure/repositories/DynamicRepository';

export class AcademicService {
  private repository: DynamicRepository;

  constructor() {
    this.repository = new DynamicRepository();
  }

  async getAreasByIds(grado: string, ids: string[]): Promise<AreaWithQuestions[]> {
    const result: AreaWithQuestions[] = [];

    for (const idAsignature of ids) {
      const document = await this.repository.findById("Area", idAsignature);
      if (!document) continue;

      const questions = await this.repository.find('question_details', {
        grado,
        tipo_platform: 'App',
        area: document.value
      });

      const preguntas = questions.map(q => q.id);
      const doc: AreaWithQuestions = {
        ...document._doc,
        childrents: preguntas
      };
      result.push(doc);
    }

    return result;
  }

  async getSubjectsByIds(grado: string, ids: string[]): Promise<SubjectWithQuestions[]> {
    const result: SubjectWithQuestions[] = [];

    for (const idAsignature of ids) {
      const document = await this.repository.findById("Asignaturas", idAsignature);
      if (!document) continue;

      const questions = await this.repository.find('question_details', {
        grado,
        tipo_platform: 'App',
        asignatura: document.value
      });

      const preguntas = questions.map(q => q.id);
      const doc: SubjectWithQuestions = {
        ...document._doc,
        childrents: preguntas
      };
      result.push(doc);
    }

    return result;
  }

  async getSubjectById(idAsignature: string, valueGrado: string): Promise<SubjectWithQuestions | null> {
    const document = await this.repository.findById("Asignaturas", idAsignature);
    if (!document) return null;

    const questions = await this.repository.find('question_details', {
      grado: valueGrado,
      tipo_platform: 'App',
      asignatura: document.value
    });

    const preguntas = questions.map(q => q.id);
    return {
      ...document._doc,
      childrents: preguntas
    };
  }

  async generateSimulacro(value: string, cantidad: string): Promise<SimulacroData> {
    const document = await this.repository.findOne('grades', { value });
    if (!document) {
      throw new Error("Grado no encontrado");
    }

    const pregunt = await this.repository.find('question_details', {
      programa: value,
      tipo_platform: 'App'
    });

    // Group questions by area
    const groupedByArea = pregunt.reduce((acc: any, curr: any) => {
      const area = curr.area || 'Sin área';
      if (!acc[area]) {
        acc[area] = [];
      }
      acc[area].push(curr.id);
      return acc;
    }, {});

    const allIds = Object.values(groupedByArea).flat() as string[];

    // Validate quantity
    const cantidadInt = parseInt(cantidad);
    const cantidadInt2 = cantidadInt > 2 ? cantidadInt : 40;

    // Choose random questions while preserving original order
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    const selectedSet = new Set(shuffled.slice(0, cantidadInt2));

    // Filter from allIds, but respect original order
    const preguntas = allIds.filter(id => selectedSet.has(id));

    return { data: preguntas };
  }

  async getQuestionById(idquestion: string): Promise<any | null> {
    return await this.repository.findById("question_details", idquestion);
  }

  async getQuestionsByTypeAndArea(idPrograma: string, value: string): Promise<QuestionsByTypeAndArea[]> {
    const grados = await this.repository.find('grades', { value: idPrograma });
    if (!grados || grados.length === 0) {
      throw new Error("Programa no encontrado");
    }

    const preguntas = await this.repository.find('question_details', {
      area: value,
      tipo_platform: { $in: [null, "Examen"] },
      programa: idPrograma,
      grado: idPrograma,
    }, {
      "pregunta": 1,
      "cod": 1,
      "id": 1,
      "area": 1
    });

    return preguntas;
  }

  async getAcademicLevelByScore(collectionName: string, id: string, score: string): Promise<any> {
    const document = await this.repository.findById(collectionName, id);
    if (!document) {
      throw new Error('Academic level not found');
    }

    const scoreValue = parseInt(score, 10);
    let previousLevelColor = null;

    for (let index = 0; index < document.types_levels.length; index++) {
      const type = document.types_levels[index];
      const min = parseInt(type.min, 10);
      const max = parseInt(type.max, 10);

      if (document.types_levels.length > 1 && index > 0) {
        previousLevelColor = document.types_levels[index - 1].color;
      }

      if (scoreValue >= min && scoreValue <= max) {
        for (const level of type.levels) {
          const puntaje = parseInt(level.puntaje, 10);
          if (scoreValue <= puntaje) {
            return {
              level: level.level,
              currentColor: type.color,
              typeName: type.name,
              previousColor: previousLevelColor
            };
          }
        }
      }
    }

    throw new Error('Score does not match any level');
  }
}
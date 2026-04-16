import { DynamicRepository, BulkUpdateResult, BulkCreateResult } from '../../infrastructure/repositories/DynamicRepository';

export interface StudentPosition {
  posicion: number;
  n_estudiantes: number;
}

export class StudentService {
  private repository: DynamicRepository;

  constructor() {
    this.repository = new DynamicRepository();
  }

  async getStudentPosition(grado: string, id_student: string): Promise<StudentPosition> {
    const student = await this.repository.findOne('students', { id_student });

    if (!student) {
      return { posicion: 0, n_estudiantes: 0 };
    }

    const gradoDoc = student.grados?.find((g: any) => g.grado === grado);
    if (!gradoDoc || gradoDoc.scoreSimulacro == 0) {
      return { posicion: 0, n_estudiantes: 0 };
    }

    const estudiantes = await this.repository.find('students', {});
    const scoresSimulacro: number[] = [];

    for (const otherStudent of estudiantes) {
      if (otherStudent.id_student === id_student) continue;

      for (const g of otherStudent.grados || []) {
        if (g.grado === grado) {
          scoresSimulacro.push(g.scoreSimulacro || 0);
        }
      }
    }

    scoresSimulacro.push(gradoDoc.scoreSimulacro);
    scoresSimulacro.sort((a, b) => b - a);

    const posicion = scoresSimulacro.indexOf(gradoDoc.scoreSimulacro) + 1;
    const n_estudiantes = estudiantes.length;

    return { posicion, n_estudiantes };
  }

  async updateStudentsBulk(collectionName: string, students: any[]): Promise<BulkUpdateResult> {
    if (!Array.isArray(students) || students.length === 0) {
      throw new Error('Se requiere un array de estudiantes para actualizar.');
    }

    return await this.repository.bulkUpdate(collectionName, students);
  }

  async createStudentsUnique(collectionName: string, students: any[]): Promise<BulkCreateResult> {
    if (!Array.isArray(students) || students.length === 0) {
      throw new Error('Se requiere un array de estudiantes.');
    }

    return await this.repository.bulkCreateUnique(collectionName, students);
  }

  async getStudentById(collectionName: string, id: string): Promise<any | null> {
    return await this.repository.findById(collectionName, id);
  }

  async getStudentByStudentId(collectionName: string, id_estudiante: string): Promise<any | null> {
    console.log(collectionName, { id_estudiante })
    return await this.repository.findOne(collectionName, { id_estudiante });
  }

  async updateStudent(collectionName: string, id: string, data: any): Promise<any | null> {
    return await this.repository.updateById(collectionName, id, data);
  }

  async deleteStudent(collectionName: string, id: string): Promise<any | null> {
    return await this.repository.deleteById(collectionName, id);
  }

  async getAllStudents(collectionName: string): Promise<any[]> {
    return await this.repository.find(collectionName);
  }

  async createStudent(collectionName: string, data: any, id?: string): Promise<any> {
    const documentData = id ? { ...data, id } : data;
    return await this.repository.create(collectionName, documentData);
  }

  async removeExamenAsignado(
    ids_estudiantes: string[],
    id_simulacro: string,
    classroomId: string,
  ): Promise<{ updated: string[]; notFound: string[] }> {
    const updated: string[] = [];
    const notFound: string[] = [];

    for (const id_estudiante of ids_estudiantes) {
      const student = await this.repository.findOne('students', { id_estudiante });

      if (!student) {
        notFound.push(id_estudiante);
        continue;
      }

      await this.repository.updateOneWithOperators(
        'students',
        { id_estudiante },
        {
          $pull: {
            examenes_asignados: {
              id_simulacro,
              classroomId,
            },
          },
        },
      );

      updated.push(id_estudiante);
    }

    return { updated, notFound };
  }

  async searchByField(collectionName: string, field: string, value: string): Promise<any[]> {
    return await this.repository.searchByField(collectionName, field, value);
  }
}
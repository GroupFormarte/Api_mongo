import { AreaUdea } from "../../../domain/interfaces/udeaInterfaces";

export function mapAsignaturaToAreaUdea(nombre: string): AreaUdea | null {
  const n = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (n.includes("razonamiento")) return "Razonamiento Lógico";
  if (n.includes("lectora") || n.includes("lectura")) return "Competencia Lectora";
  return null;
}
import type { PatientFullData } from './types';
import { parseIndications, isLegacyDate } from './indications';

const GOAL_LABELS: Record<string, string> = {
  lose: 'Bajar de peso',
  maintain: 'Mantenimiento',
  gain: 'Ganar masa muscular',
};
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero (1-3 días/sem)',
  moderate: 'Moderado (3-5 días/sem)',
  active: 'Activo (6-7 días/sem)',
  very_active: 'Muy activo (trabajo físico + gym)',
};

export function buildPatientSystemPrompt(patient: PatientFullData): string {
  const p = patient.profile;
  const lines: string[] = [
    'Eres NutriIA, asistente de nutrición clínica para profesionales de la salud.',
    'Responde en español, con rigor científico y lenguaje profesional.',
    '',
    `## Paciente: ${patient.name} (${patient.email})`,
  ];

  if (p) {
    lines.push('### Datos antropométricos');
    if (p.age) lines.push(`- Edad: ${p.age} años`);
    if (p.sex) lines.push(`- Sexo: ${p.sex === 'male' ? 'Masculino' : p.sex === 'female' ? 'Femenino' : 'Otro'}`);
    if (p.heightCm) lines.push(`- Estatura: ${p.heightCm} cm`);
    if (p.weightKg) {
      const hm = (p.heightCm ?? 170) / 100;
      const imc = (p.weightKg / (hm * hm)).toFixed(1);
      lines.push(`- Peso: ${p.weightKg} kg (IMC ${imc})`);
    }
    lines.push('### Metas nutricionales');
    if (p.goal) lines.push(`- Objetivo: ${GOAL_LABELS[p.goal] ?? p.goal}`);
    if (p.activityLevel) lines.push(`- Actividad: ${ACTIVITY_LABELS[p.activityLevel] ?? p.activityLevel}`);
    if (p.maintenanceCalories) lines.push(`- TDEE (mantenimiento): ${Math.round(p.maintenanceCalories)} kcal/día`);
    if (p.targetCalories) lines.push(`- Meta calórica diaria: ${Math.round(p.targetCalories)} kcal`);
    if (p.proteinGoalG) lines.push(`- Meta de proteína: ${Math.round(p.proteinGoalG)} g/día`);
  }

  if (patient.mealPlans?.length) {
    lines.push('### Plan de comidas');
    patient.mealPlans.forEach(mp => {
      lines.push(`- ${mp.name}${mp.time ? ` (${mp.time})` : ''}: ${Math.round(mp.targetKcal)} kcal`);
    });
  }

  const recentLogs = [...(patient.recentLogs ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  if (recentLogs.length) {
    lines.push('### Últimos 7 días registrados');
    recentLogs.forEach(d => {
      lines.push(`- ${d.date}: ${Math.round(d.totalKcal)} kcal | P: ${Math.round(d.totalProteinG)}g | C: ${Math.round(d.totalCarbsG)}g | G: ${Math.round(d.totalFatG)}g`);
    });
    const avgKcal = Math.round(recentLogs.reduce((s, d) => s + d.totalKcal, 0) / recentLogs.length);
    lines.push(`- Promedio: ${avgKcal} kcal/día`);
  }

  if (patient.weightLogs?.length) {
    lines.push('### Historial de peso reciente');
    [...patient.weightLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).forEach(w => {
      lines.push(`- ${w.date}: ${w.weightKg} kg`);
    });
  }

  if (patient.professionalNotes?.trim()) {
    const indications = parseIndications(patient.professionalNotes);
    if (indications.length > 0) {
      lines.push('### Mis indicaciones para este paciente (más recientes primero)');
      indications.slice(0, 3).forEach((ind, i) => {
        const dateStr = isLegacyDate(ind.createdAt)
          ? ''
          : ` — ${new Date(ind.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        lines.push(`**${i + 1}${dateStr}:** ${ind.content}`);
      });
    }
  }

  lines.push('');
  lines.push('Responde de forma útil y accionable para el profesional. Puedes sugerir ajustes al plan, alertar sobre déficits, o analizar la adherencia.');

  return lines.join('\n');
}

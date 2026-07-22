export interface IndicationPreset {
  id: string;
  label: string;
  content: string;
}

export const INDICATION_PRESETS: IndicationPreset[] = [
  {
    id: 'protein',
    label: '🥩 Proteína',
    content: 'Aumentar consumo de proteína a 1.5 g/kg de peso corporal. Priorizar fuentes magras: pollo, huevo, pescado y leguminosas.',
  },
  {
    id: 'hydration',
    label: '💧 Hidratación',
    content: 'Mantener mínimo 2 litros de agua al día. Evitar bebidas azucaradas, refrescos y jugos envasados.',
  },
  {
    id: 'reduce_sugar',
    label: '🚫 Sin azúcares',
    content: 'Eliminar azúcares añadidos y productos ultraprocesados. Optar por frutas enteras como fuente natural de dulce.',
  },
  {
    id: 'meal_timing',
    label: '⏰ Horarios',
    content: 'Respetar 3 comidas principales al día con intervalos de 4-5 horas. No saltarse el desayuno.',
  },
  {
    id: 'portions',
    label: '🍽️ Porciones',
    content: 'Usar el plato del bien comer: mitad verduras, un cuarto proteína, un cuarto cereales integrales. Comer despacio y masticar bien.',
  },
  {
    id: 'exercise',
    label: '🏃 Actividad',
    content: 'Realizar al menos 150 min de actividad moderada por semana. Incluir caminatas de 30 min diarios como mínimo.',
  },
  {
    id: 'fiber',
    label: '🥦 Fibra',
    content: 'Incrementar fibra dietética: verduras, frutas con cáscara, leguminosas y cereales integrales. Meta: 25-30 g/día.',
  },
  {
    id: 'register',
    label: '📱 Registrar',
    content: 'Continuar registrando todos los alimentos en la app diariamente. La consistencia en el registro es clave para el seguimiento.',
  },
];

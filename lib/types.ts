export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'professional';
  createdAt: string;
}

export interface UserProfile {
  userId: number;
  age?: number;
  sex?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
  goal?: 'lose' | 'maintain' | 'gain';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  maintenanceCalories?: number;
  targetCalories?: number;
  dailyExerciseCalories?: number;
  proteinGoalG?: number;
  carbGoalG?: number;
  fatGoalG?: number;
}

export interface MealPlan {
  id: number;
  name: string;
  time?: string;
  targetKcal: number;
}

export interface DayLog {
  date: string;
  totalKcal: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  items: Array<{
    foodName: string;
    mealPlanName?: string;
    servings: number;
    kcal: number;
    proteinG: number;
  }>;
}

export interface WeightLog {
  id: number;
  date: string;
  weightKg: number;
}

export interface PatientSummary {
  userId: number;
  name: string;
  email: string;
  profession?: string;
  grantedAt: string;
  profile?: Partial<UserProfile>;
  todayKcal?: number;
  targetKcal?: number;
  lastLogDate?: string;
  weeklyAvgKcal?: number;
  currentWeightKg?: number;
}

export interface PatientFullData {
  userId: number;
  name: string;
  email: string;
  profile?: UserProfile;
  mealPlans: MealPlan[];
  recentLogs: DayLog[];
  weightLogs: WeightLog[];
  professionalNotes?: string | null;
  professionalNotesUpdatedAt?: string | null;
}

export interface StoredSession {
  token: string;
  user: User;
}

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface MealOrigin {
  food: string;
  origin: string;
}

export interface MealData {
  date: string;
  meal: string[];
  type: string;
  origin: MealOrigin[];
}

export interface MealAllergy {
  type: string;
  code: string;
}

export interface Mealnutrition {
  type: string;
  amount: string;
}

export interface MealItem {
  food: string;
  allergy: MealAllergy[];
}

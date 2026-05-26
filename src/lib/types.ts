export type Sex = "male" | "female";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export type Goal = "mild" | "standard" | "aggressive" | "maintain";

export type DietType =
  | "ketogenic"
  | "mediterranean"
  | "lowCarb"
  | "balanced"
  | "vegetarian";

export type SimplicityLevel = "zeroSbatti" | "standard" | "mealPrep";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type UserProfile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dietType: DietType;
  targetCalories?: number;
  mealsPerDay: number;
  excludedFoods: string[];
  simplicityLevel: SimplicityLevel;
  budgetMode: boolean;
};

export type Ingredient = {
  name: string;
  grams: number;
};

export type Meal = {
  id: string;
  name: string;
  mealType: MealType;
  dietTypes: DietType[];
  ingredients: Ingredient[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tags: string[];
};

export type PlannedMeal = Meal & {
  day: number;
};

export type MealPlanDay = {
  day: number;
  label: string;
  meals: PlannedMeal[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type GroceryItem = {
  name: string;
  grams: number;
};

export type CalorieResult = {
  bmr: number;
  tdee: number;
  suggestedCalories: number;
  suggestedRange: [number, number];
  warnings: string[];
};

export type MealPlan = {
  days: MealPlanDay[];
  dailyCalories: number;
  groceryList: GroceryItem[];
  warnings: string[];
  calorieResult: CalorieResult;
};

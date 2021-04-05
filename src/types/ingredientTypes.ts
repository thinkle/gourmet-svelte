export interface Amount {
  amount?: number;
  unit?: string;
  rangeAmount?: number;
  gramWeight: number;
  inferred_gramWeight: number;
  standardUnit?: string;
  text?: string;
  pretext?: string;
  posttext?: string;
}

export interface Ingredient {
  amount?: Amount;
  text?: string;
  reference?: string;
  fdcId?: number;
  inferred_fdcId?: number;
}

// Reference: https://www.fda.gov/media/99059/download
// Reference : https://www.fda.gov/media/99069/download

export const MACRO_RDI = [
  {
    "nutrient": "Fat",
    "unit": "g",
    "RDI": 78,
    id : 1004,

  },
  {
    "nutrient": "Saturated Fat",
    "unit": "g",
    "RDI": 20,
    id:1258
  },
  {
    "nutrient": "Cholesterol",
    "unit": "mg",
    "RDI": 300,
    id:1253
  },
  {
    "nutrient": "Carbohydrates",
    "unit": "g",
    "RDI": 275,
    id:1005
  },
  {
    "nutrient": "Sodium",
    "unit": "mg",
    "RDI": 2300,
    id:1093
  },
  {
    "nutrient": "Dietary Fiber",
    "unit": "g",
    "RDI": 28,
    id:1079
  },
  {
    "nutrient": "Protein",
    "unit": "g",
    "RDI": 50,
    id:1003
  },
  {
    "nutrient": "Added sugars",
    "unit": "g",
    "RDI": 50,
  }
]

export const RDI_BY_NUTRIENT = {}

export const NUTRIENTS_RDI = [
  {
    "nutrient": "Vitamin A",
    "unit": "micograms RAE",
    "RDI": 900,
    id:1106
  },
  {
    "nutrient": "Vitamin C",
    "unit": "mg",
    "RDI": 90,
    id:1162,
  },
  {
    "nutrient": "Calcium",
    "unit": "mg",
    "RDI": 1300,
    id:1087
  },
  {
    "nutrient": "Iron",
    "unit": "mg",
    "RDI": 18,
    id:1089,
  },
  {
    "nutrient": "Vitamin D",
    "unit": "mcg",
    "RDI": 20,
    id:1114
  },
  {
    "nutrient": "Vitamin E",
    "unit": "mg",
    "RDI": 15,
    id:1109
  },
  {
    "nutrient": "Vitamin K",
    "unit": "mcg",
    "RDI": 120,
    id:1185
  },
  {
    "nutrient": "Thiamin",
    "unit": "mg",
    "RDI": 1.2,
    id:1165
  },
  {
    "nutrient": "Riboflavin",
    "unit": "mg",
    "RDI": 1.3,
    id:1166
  },
  {
    "nutrient": "Niacin",
    "unit": "mg",
    "RDI": 16,
    id:1167
  },
  {
    "nutrient": "Vitamin B6",
    "unit": "mg",
    "RDI": 1.7,
    id:1175
  },
  {
    "nutrient": "Folate",
    "unit": "mcg",
    "RDI": 400,
    id:1177
  },
  {
    "nutrient": "Vitamin B12",
    "unit": "mcg",
    "RDI": 2.4,
    id:1178
  },
  {
    "nutrient": "Biotin",
    "unit": "mcg",
    "RDI": 30
  },
  {
    "nutrient": "Pantothenic acid",
    "unit": "mg",
    "RDI": 5
  },
  {
    "nutrient": "Phosphorus",
    "unit": "mg",
    "RDI": 1250,
    id:1091,
  },
  {
    "nutrient": "Iodine",
    "unit": "mcg",
    "RDI": 150
  },
  {
    "nutrient": "Magnesium",
    "unit": "mg",
    "RDI": 420, 
    id: 1090,
  },
  {
    "nutrient": "Zinc",
    "unit": "mg",
    "RDI": 11,
    id:1095
  },
  {
    "nutrient": "Selenium",
    "unit": "mcg",
    "RDI": 55,
    id:1103
  },
  {
    "nutrient": "Copper",
    "unit": "mg",
    "RDI": 0.9,
    id:1098
  },
  {
    "nutrient": "Manganese",
    "unit": "mg",
    "RDI": 2.3
  },
  {
    "nutrient": "Chromium",
    "unit": "mcg",
    "RDI": 35
  },
  {
    "nutrient": "Molybdenum",
    "unit": "mcg",
    "RDI": 45
  },
  {
    "nutrient": "Chloride",
    "unit": "mg",
    "RDI": 2300
  },
  {
    "nutrient": "Potassium",
    "unit": "mg",
    "RDI": 4700,
    id:1092
  },
  {
    "nutrient": "Choline",
    "unit": "mg",
    "RDI": 550,
    id:1180
  },
]

for (let n of MACRO_RDI) {
  RDI_BY_NUTRIENT[n.nutrient] = n;
  if (n.id) {
    RDI_BY_NUTRIENT[n.id] = n;
  }
}
for (let n of NUTRIENTS_RDI) {
  RDI_BY_NUTRIENT[n.nutrient] = n;
  if (n.id) {
    RDI_BY_NUTRIENT[n.id] = n;
  }
}
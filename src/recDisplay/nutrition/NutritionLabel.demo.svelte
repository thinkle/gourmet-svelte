<script>
  import NutritionLabel from './NutritionLabel.svelte';

  let nutritionInfo = {
    "wweiaFoodCategory": {
        "wweiaFoodCategoryCode": 6802,
        "wweiaFoodCategoryDescription": "White potatoes, baked or boiled"
    },
    "description": "Potato, baked, peel not eaten",
    "foodAttributes": [
        {
            "id": 976282,
            "value": "NS as to peel eaten",
            "sequenceNumber": 1,
            "foodAttributeType": {
                "id": 1001,
                "name": "Additional Description",
                "description": "Additional descriptions for the food."
            }
        },
        {
            "id": 990409,
            "value": "6802",
            "name": "WWEIA Category number",
            "foodAttributeType": {
                "id": 999,
                "name": "Attribute",
                "description": "Generic attributes"
            }
        },
        {
            "id": 998600,
            "value": "White potatoes, baked or boiled",
            "name": "WWEIA Category description",
            "foodAttributeType": {
                "id": 999,
                "name": "Attribute",
                "description": "Generic attributes"
            }
        }
    ],
    "foodCode": "71101000",
    "inputFoods": [
        {
            "id": 98742,
            "foodDescription": "Potatoes, baked, flesh, without salt",
            "ingredientDescription": "Potatoes, baked, flesh, without salt",
            "ingredientWeight": 285,
            "portionCode": "0",
            "portionDescription": "NONE",
            "sequenceNumber": 1,
            "ingredientCode": 11363,
            "unit": "GM",
            "amount": 285
        },
        {
            "id": 98743,
            "foodDescription": "Salt, table, iodized",
            "ingredientDescription": "Salt, table, iodized",
            "ingredientWeight": 1.3,
            "portionCode": "0",
            "portionDescription": "NONE",
            "sequenceNumber": 2,
            "ingredientCode": 2047,
            "unit": "GM",
            "amount": 1.3
        }
    ],
    "startDate": "1/1/2017",
    "endDate": "12/31/2018",
    "foodComponents": [],
    "foodClass": "Survey",
    "fdcId": 1102881,
    "publicationDate": "10/30/2020",
    "foodNutrients": [
        {
            "nutrient": {
                "id": 2045,
                "number": "951",
                "name": "Proximates",
                "rank": 50,
                "unitName": "g"
            },
            "type": "FoodNutrient"
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1051,
                "number": "255",
                "name": "Water",
                "rank": 100,
                "unitName": "g"
            },
            "id": 13224338,
            "amount": 75.08
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1008,
                "number": "208",
                "name": "Energy",
                "rank": 300,
                "unitName": "kcal"
            },
            "id": 13224336,
            "amount": 93
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1003,
                "number": "203",
                "name": "Protein",
                "rank": 600,
                "unitName": "g"
            },
            "id": 13224333,
            "amount": 1.95
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1004,
                "number": "204",
                "name": "Total lipid (fat)",
                "rank": 800,
                "unitName": "g"
            },
            "id": 13224334,
            "amount": 0.1
        },
        {
            "nutrient": {
                "id": 2039,
                "number": "956",
                "name": "Carbohydrates",
                "rank": 1100,
                "unitName": "g"
            },
            "type": "FoodNutrient"
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1005,
                "number": "205",
                "name": "Carbohydrate, by difference",
                "rank": 1110,
                "unitName": "g"
            },
            "id": 13224335,
            "amount": 21.45
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1079,
                "number": "291",
                "name": "Fiber, total dietary",
                "rank": 1200,
                "unitName": "g"
            },
            "id": 13224342,
            "amount": 1.5
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 2000,
                "number": "269",
                "name": "Sugars, total including NLEA",
                "rank": 1510,
                "unitName": "g"
            },
            "id": 13224341,
            "amount": 1.69
        },
        {
            "nutrient": {
                "id": 2043,
                "number": "300",
                "name": "Minerals",
                "rank": 5200,
                "unitName": "mg"
            },
            "type": "FoodNutrient"
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1087,
                "number": "301",
                "name": "Calcium, Ca",
                "rank": 5300,
                "unitName": "mg"
            },
            "id": 13224343,
            "amount": 5
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1089,
                "number": "303",
                "name": "Iron, Fe",
                "rank": 5400,
                "unitName": "mg"
            },
            "id": 13224344,
            "amount": 0.35
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1090,
                "number": "304",
                "name": "Magnesium, Mg",
                "rank": 5500,
                "unitName": "mg"
            },
            "id": 13224345,
            "amount": 25
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1091,
                "number": "305",
                "name": "Phosphorus, P",
                "rank": 5600,
                "unitName": "mg"
            },
            "id": 13224346,
            "amount": 50
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1092,
                "number": "306",
                "name": "Potassium, K",
                "rank": 5700,
                "unitName": "mg"
            },
            "id": 13224347,
            "amount": 389
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1093,
                "number": "307",
                "name": "Sodium, Na",
                "rank": 5800,
                "unitName": "mg"
            },
            "id": 13224348,
            "amount": 181
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1095,
                "number": "309",
                "name": "Zinc, Zn",
                "rank": 5900,
                "unitName": "mg"
            },
            "id": 13224349,
            "amount": 0.29
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1098,
                "number": "312",
                "name": "Copper, Cu",
                "rank": 6000,
                "unitName": "mg"
            },
            "id": 13224350,
            "amount": 0.214
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1103,
                "number": "317",
                "name": "Selenium, Se",
                "rank": 6200,
                "unitName": "µg"
            },
            "id": 13224351,
            "amount": 0.3
        },
        {
            "nutrient": {
                "id": 2046,
                "number": "952",
                "name": "Vitamins and Other Components",
                "rank": 6250,
                "unitName": "g"
            },
            "type": "FoodNutrient"
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1162,
                "number": "401",
                "name": "Vitamin C, total ascorbic acid",
                "rank": 6300,
                "unitName": "mg"
            },
            "id": 13224361,
            "amount": 12.7
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1165,
                "number": "404",
                "name": "Thiamin",
                "rank": 6400,
                "unitName": "mg"
            },
            "id": 13224362,
            "amount": 0.105
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1166,
                "number": "405",
                "name": "Riboflavin",
                "rank": 6500,
                "unitName": "mg"
            },
            "id": 13224363,
            "amount": 0.021
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1167,
                "number": "406",
                "name": "Niacin",
                "rank": 6600,
                "unitName": "mg"
            },
            "id": 13224364,
            "amount": 1.389
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1175,
                "number": "415",
                "name": "Vitamin B-6",
                "rank": 6800,
                "unitName": "mg"
            },
            "id": 13224365,
            "amount": 0.3
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1177,
                "number": "417",
                "name": "Folate, total",
                "rank": 6900,
                "unitName": "µg"
            },
            "id": 13224366,
            "amount": 9
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1186,
                "number": "431",
                "name": "Folic acid",
                "rank": 7000,
                "unitName": "µg"
            },
            "id": 13224370,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1187,
                "number": "432",
                "name": "Folate, food",
                "rank": 7100,
                "unitName": "µg"
            },
            "id": 13224371,
            "amount": 9
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1190,
                "number": "435",
                "name": "Folate, DFE",
                "rank": 7200,
                "unitName": "µg"
            },
            "id": 13224372,
            "amount": 9
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1180,
                "number": "421",
                "name": "Choline, total",
                "rank": 7220,
                "unitName": "mg"
            },
            "id": 13224368,
            "amount": 14.4
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1178,
                "number": "418",
                "name": "Vitamin B-12",
                "rank": 7300,
                "unitName": "µg"
            },
            "id": 13224367,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1246,
                "number": "578",
                "name": "Vitamin B-12, added",
                "rank": 7340,
                "unitName": "µg"
            },
            "id": 13224374,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1106,
                "number": "320",
                "name": "Vitamin A, RAE",
                "rank": 7420,
                "unitName": "µg"
            },
            "id": 13224353,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1105,
                "number": "319",
                "name": "Retinol",
                "rank": 7430,
                "unitName": "µg"
            },
            "id": 13224352,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1107,
                "number": "321",
                "name": "Carotene, beta",
                "rank": 7440,
                "unitName": "µg"
            },
            "id": 13224354,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1108,
                "number": "322",
                "name": "Carotene, alpha",
                "rank": 7450,
                "unitName": "µg"
            },
            "id": 13224355,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1120,
                "number": "334",
                "name": "Cryptoxanthin, beta",
                "rank": 7460,
                "unitName": "µg"
            },
            "id": 13224358,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1122,
                "number": "337",
                "name": "Lycopene",
                "rank": 7530,
                "unitName": "µg"
            },
            "id": 13224359,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1123,
                "number": "338",
                "name": "Lutein + zeaxanthin",
                "rank": 7560,
                "unitName": "µg"
            },
            "id": 13224360,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1109,
                "number": "323",
                "name": "Vitamin E (alpha-tocopherol)",
                "rank": 7905,
                "unitName": "mg"
            },
            "id": 13224356,
            "amount": 0.04
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1242,
                "number": "573",
                "name": "Vitamin E, added",
                "rank": 7920,
                "unitName": "mg"
            },
            "id": 13224373,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1114,
                "number": "328",
                "name": "Vitamin D (D2 + D3)",
                "rank": 8700,
                "unitName": "µg"
            },
            "id": 13224357,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1185,
                "number": "430",
                "name": "Vitamin K (phylloquinone)",
                "rank": 8800,
                "unitName": "µg"
            },
            "id": 13224369,
            "amount": 0.3
        },
        {
            "nutrient": {
                "id": 2044,
                "number": "950",
                "name": "Lipids",
                "rank": 9600,
                "unitName": "g"
            },
            "type": "FoodNutrient"
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1258,
                "number": "606",
                "name": "Fatty acids, total saturated",
                "rank": 9700,
                "unitName": "g"
            },
            "id": 13224376,
            "amount": 0.026
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1259,
                "number": "607",
                "name": "4:0",
                "rank": 9800,
                "unitName": "g"
            },
            "id": 13224377,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1260,
                "number": "608",
                "name": "6:0",
                "rank": 9900,
                "unitName": "g"
            },
            "id": 13224378,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1261,
                "number": "609",
                "name": "8:0",
                "rank": 10000,
                "unitName": "g"
            },
            "id": 13224379,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1262,
                "number": "610",
                "name": "10:0",
                "rank": 10100,
                "unitName": "g"
            },
            "id": 13224380,
            "amount": 0.001
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1263,
                "number": "611",
                "name": "12:0",
                "rank": 10300,
                "unitName": "g"
            },
            "id": 13224381,
            "amount": 0.003
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1264,
                "number": "612",
                "name": "14:0",
                "rank": 10500,
                "unitName": "g"
            },
            "id": 13224382,
            "amount": 0.001
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1265,
                "number": "613",
                "name": "16:0",
                "rank": 10700,
                "unitName": "g"
            },
            "id": 13224383,
            "amount": 0.016
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1266,
                "number": "614",
                "name": "18:0",
                "rank": 10900,
                "unitName": "g"
            },
            "id": 13224384,
            "amount": 0.004
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1292,
                "number": "645",
                "name": "Fatty acids, total monounsaturated",
                "rank": 11400,
                "unitName": "g"
            },
            "id": 13224396,
            "amount": 0.002
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1275,
                "number": "626",
                "name": "16:1",
                "rank": 11700,
                "unitName": "g"
            },
            "id": 13224390,
            "amount": 0.001
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1268,
                "number": "617",
                "name": "18:1",
                "rank": 12100,
                "unitName": "g"
            },
            "id": 13224385,
            "amount": 0.001
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1277,
                "number": "628",
                "name": "20:1",
                "rank": 12400,
                "unitName": "g"
            },
            "id": 13224392,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1279,
                "number": "630",
                "name": "22:1",
                "rank": 12500,
                "unitName": "g"
            },
            "id": 13224394,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1293,
                "number": "646",
                "name": "Fatty acids, total polyunsaturated",
                "rank": 12900,
                "unitName": "g"
            },
            "id": 13224397,
            "amount": 0.043
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1269,
                "number": "618",
                "name": "18:2",
                "rank": 13100,
                "unitName": "g"
            },
            "id": 13224386,
            "amount": 0.032
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1270,
                "number": "619",
                "name": "18:3",
                "rank": 13900,
                "unitName": "g"
            },
            "id": 13224387,
            "amount": 0.01
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1276,
                "number": "627",
                "name": "18:4",
                "rank": 14250,
                "unitName": "g"
            },
            "id": 13224391,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1271,
                "number": "620",
                "name": "20:4",
                "rank": 14700,
                "unitName": "g"
            },
            "id": 13224388,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1278,
                "number": "629",
                "name": "20:5 n-3 (EPA)",
                "rank": 15000,
                "unitName": "g"
            },
            "id": 13224393,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1280,
                "number": "631",
                "name": "22:5 n-3 (DPA)",
                "rank": 15200,
                "unitName": "g"
            },
            "id": 13224395,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1272,
                "number": "621",
                "name": "22:6 n-3 (DHA)",
                "rank": 15300,
                "unitName": "g"
            },
            "id": 13224389,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1253,
                "number": "601",
                "name": "Cholesterol",
                "rank": 15700,
                "unitName": "mg"
            },
            "id": 13224375,
            "amount": 0
        },
        {
            "nutrient": {
                "id": 2042,
                "number": "500",
                "name": "Amino acids",
                "rank": 16250,
                "unitName": "g"
            },
            "type": "FoodNutrient"
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1018,
                "number": "221",
                "name": "Alcohol, ethyl",
                "rank": 18200,
                "unitName": "g"
            },
            "id": 13224337,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1057,
                "number": "262",
                "name": "Caffeine",
                "rank": 18300,
                "unitName": "mg"
            },
            "id": 13224339,
            "amount": 0
        },
        {
            "type": "FoodNutrient",
            "nutrient": {
                "id": 1058,
                "number": "263",
                "name": "Theobromine",
                "rank": 18400,
                "unitName": "mg"
            },
            "id": 13224340,
            "amount": 0
        }
    ],
    "foodPortions": [
        {
            "id": 265641,
            "portionDescription": "Quantity not specified",
            "gramWeight": 285,
            "sequenceNumber": 10,
            "modifier": "90000",
            "measureUnit": {
                "id": 9999,
                "name": "undetermined",
                "abbreviation": "undetermined"
            }
        },
        {
            "id": 252162,
            "portionDescription": "1 small",
            "gramWeight": 230,
            "sequenceNumber": 1,
            "modifier": "62015",
            "measureUnit": {
                "id": 9999,
                "name": "undetermined",
                "abbreviation": "undetermined"
            }
        },
        {
            "id": 249338,
            "portionDescription": "1 medium",
            "gramWeight": 285,
            "sequenceNumber": 2,
            "modifier": "61238",
            "measureUnit": {
                "id": 9999,
                "name": "undetermined",
                "abbreviation": "undetermined"
            }
        },
        {
            "id": 248291,
            "portionDescription": "1 large",
            "gramWeight": 400,
            "sequenceNumber": 3,
            "modifier": "60919",
            "measureUnit": {
                "id": 9999,
                "name": "undetermined",
                "abbreviation": "undetermined"
            }
        },
        {
            "id": 239314,
            "portionDescription": "1 cup",
            "gramWeight": 130,
            "sequenceNumber": 4,
            "modifier": "10205",
            "measureUnit": {
                "id": 9999,
                "name": "undetermined",
                "abbreviation": "undetermined"
            }
        }
    ],
    "dataType": "Survey (FNDDS)"
}

</script>
<NutritionLabel
nutrients={nutritionInfo.foodNutrients}
/>
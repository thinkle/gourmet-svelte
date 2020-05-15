const parsedChunks = [
  {
    "id": "oiweras01",
    "html": "4 servings",
    "tag": "yields",
    "text": "4 servings",
    "address": "00002-00013-00005-00001-00001-00001-00001-00005-00003-00001-00003-00000-00000"
  },
  {
    "id": "oiweras02",
    "html": "25 minutes",
    "tag": "time",
    "text": "25 minutes",
    "address": "00002-00013-00005-00001-00001-00001-00001-00005-00003-00003-00003-00000-00000"
  },
  {
    "id": "oiweras03",
    "html": "\n              Coconut-Miso Salmon Curry\n        ",
    "tag": "title",
    "text": "\n              Coconut-Miso Salmon Curry\n        ",
    "address": "00002-00013-00005-00001-00001-00001-00001-00003-00001-00000-00000"
  },
  {
    "id": "oiweras04",
    "html": "\n          <a class=\"author personality\" data-author=\"Kay Chun\" href=\"/search?q=Kay+Chun\">\n             <span class=\"byline-name\">Kay Chun</span>\n          </a>\n        ",
    "tag": "source",
    "text": "\n          \n             Kay Chun\n          \n        ",
    "address": "00002-00013-00005-00001-00001-00001-00001-00005-00001-00000-00000"
  },
  {
    "id": "oiweras05",
    "html": "\n                      3\n                    ",
    "tag": "amount",
    "text": "\n                      3\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00001-00001-00000-00000"
  },
  {
    "id": "oiweras06",
    "html": "\n                      1\n                    ",
    "tag": "amount",
    "text": "\n                      1\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00003-00001-00000-00000"
  },
  {
    "id": "oiweras07",
    "html": "\n                      1\n                    ",
    "tag": "amount",
    "text": "\n                      1\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00005-00001-00000-00000"
  },
  {
    "id": "oiweras08",
    "html": "\n                      3\n                    ",
    "tag": "amount",
    "text": "\n                      3\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00007-00001-00000-00000"
  },
  {
    "id": "oiweras09",
    "html": "\n                      \n                    ",
    "tag": "amount",
    "text": "\n                      \n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00009-00001-00000-00000"
  },
  {
    "id": "oiweras010",
    "html": "\n                      ¼\n                    ",
    "tag": "amount",
    "text": "\n                      ¼\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00011-00001-00000-00000"
  },
  {
    "id": "oiweras011",
    "html": "\n                      ½\n                    ",
    "tag": "amount",
    "text": "\n                      ½\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00013-00001-00000-00000"
  },
  {
    "id": "oiweras012",
    "html": "\n                      1\n                    ",
    "tag": "amount",
    "text": "\n                      1\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00015-00001-00000-00000"
  },
  {
    "id": "oiweras013",
    "html": "\n                      5\n                    ",
    "tag": "amount",
    "text": "\n                      5\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00017-00001-00000-00000"
  },
  {
    "id": "oiweras014",
    "html": "\n                      1\n                    ",
    "tag": "amount",
    "text": "\n                      1\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00019-00001-00000-00000"
  },
  {
    "id": "oiweras015",
    "html": "\n                      \n                    ",
    "tag": "amount",
    "text": "\n                      \n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00021-00001-00000-00000"
  },
  {
    "id": "oiweras016",
    "html": "\n                      ¼\n                    ",
    "tag": "amount",
    "text": "\n                      ¼\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00023-00001-00000-00000"
  },
  {
    "id": "oiweras017",
    "html": "\n                      ¼\n                    ",
    "tag": "amount",
    "text": "\n                      ¼\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00025-00001-00000-00000"
  },
  {
    "id": "oiweras018",
    "html": "<span class=\"icon-nutritional-info\"></span>",
    "tag": "amount",
    "text": "",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00009-00001-00001-00001-00000-00000"
  },
  {
    "id": "oiweras019",
    "html": "\n                      tablespoons safflower or canola oil\n                    ",
    "tag": "ingredient",
    "text": "\n                      tablespoons safflower or canola oil\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00001-00003-00000-00000"
  },
  {
    "id": "oiweras020",
    "html": "\n                      medium red onion, halved and sliced 1/2-inch thick (about 2 cups)\n                    ",
    "tag": "ingredient",
    "text": "\n                      medium red onion, halved and sliced 1/2-inch thick (about 2 cups)\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00003-00003-00000-00000"
  },
  {
    "id": "oiweras021",
    "html": "\n                      (1-inch) piece fresh ginger, minced (about 2 tablespoons)\n                    ",
    "tag": "ingredient",
    "text": "\n                      (1-inch) piece fresh ginger, minced (about 2 tablespoons)\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00005-00003-00000-00000"
  },
  {
    "id": "oiweras022",
    "html": "\n                      garlic cloves, thinly sliced\n                    ",
    "tag": "ingredient",
    "text": "\n                      garlic cloves, thinly sliced\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00007-00003-00000-00000"
  },
  {
    "id": "oiweras023",
    "html": "\n                      Kosher salt and black pepper\n                    ",
    "tag": "ingredient",
    "text": "\n                      Kosher salt and black pepper\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00009-00003-00000-00000"
  },
  {
    "id": "oiweras024",
    "html": "\n                      cup white miso\n                    ",
    "tag": "ingredient",
    "text": "\n                      cup white miso\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00011-00003-00000-00000"
  },
  {
    "id": "oiweras025",
    "html": "\n                      cup unsweetened, full-fat canned coconut milk\n                    ",
    "tag": "ingredient",
    "text": "\n                      cup unsweetened, full-fat canned coconut milk\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00013-00003-00000-00000"
  },
  {
    "id": "oiweras026",
    "html": "\n                      (1 1/2-pound) salmon fillet, cut into 2-inch pieces\n                    ",
    "tag": "ingredient",
    "text": "\n                      (1 1/2-pound) salmon fillet, cut into 2-inch pieces\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00015-00003-00000-00000"
  },
  {
    "id": "oiweras027",
    "html": "\n                      ounces baby spinach (about 5 packed cups)\n                    ",
    "tag": "ingredient",
    "text": "\n                      ounces baby spinach (about 5 packed cups)\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00017-00003-00000-00000"
  },
  {
    "id": "oiweras028",
    "html": "\n                      tablespoon fresh lime juice, plus lime wedges for serving\n                    ",
    "tag": "ingredient",
    "text": "\n                      tablespoon fresh lime juice, plus lime wedges for serving\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00019-00003-00000-00000"
  },
  {
    "id": "oiweras029",
    "html": "\n                      Steamed rice, such as jasmine or basmati, for serving\n                    ",
    "tag": "ingredient",
    "text": "\n                      Steamed rice, such as jasmine or basmati, for serving\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00021-00003-00000-00000"
  },
  {
    "id": "oiweras030",
    "html": "\n                      cup chopped fresh basil\n                    ",
    "tag": "ingredient",
    "text": "\n                      cup chopped fresh basil\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00023-00003-00000-00000"
  },
  {
    "id": "oiweras031",
    "html": "\n                      cup chopped fresh cilantro\n                    ",
    "tag": "ingredient",
    "text": "\n                      cup chopped fresh cilantro\n                    ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00003-00025-00003-00000-00000"
  },
  {
    "id": "oiweras032",
    "html": "<span class=\"nutrition-label\">Nutritional Information</span>",
    "tag": "ingredient",
    "text": "Nutritional Information",
    "address": "00002-00013-00005-00001-00001-00001-00017-00001-00009-00001-00001-00003-00000-00000"
  },
  {
    "id": "oiweras033",
    "html": "\n                <p>This light, delicate weeknight curry comes together in less than 30 minutes and is defined by its deep miso flavor. Miso is typically whisked into soups toward the end of the recipe, but sweating it directly in the pot with ginger, garlic and a little oil early on helps the paste caramelize, intensifying its earthy sweetness. Adding coconut milk creates a rich broth that works with a wide range of seafood. Salmon is used here, but flaky white fish, shrimp or scallops would all benefit from this quick poaching method. A squeeze of lime and a flurry of fresh herbs keep this curry bright and citrusy. For a hit of heat, garnish with sliced fresh jalapeño or serrano chile peppers.</p>\n                \n\n\n              ",
    "tag": "text",
    "text": "\n                This light, delicate weeknight curry comes together in less than 30 minutes and is defined by its deep miso flavor. Miso is typically whisked into soups toward the end of the recipe, but sweating it directly in the pot with ginger, garlic and a little oil early on helps the paste caramelize, intensifying its earthy sweetness. Adding coconut milk creates a rich broth that works with a wide range of seafood. Salmon is used here, but flaky white fish, shrimp or scallops would all benefit from this quick poaching method. A squeeze of lime and a flurry of fresh herbs keep this curry bright and citrusy. For a hit of heat, garnish with sliced fresh jalapeño or serrano chile peppers.\n                \n\n\n              ",
    "address": "00002-00013-00005-00001-00001-00001-00003-00005-00001-00000-00000"
  },
  {
    "id": "oiweras034",
    "html": "Curries",
    "tag": "category",
    "text": "Curries",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00001-00000-00000"
  },
  {
    "id": "oiweras035",
    "html": "Seafood",
    "tag": "category",
    "text": "Seafood",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00003-00000-00000"
  },
  {
    "id": "oiweras036",
    "html": "Coconut Milk",
    "tag": "category",
    "text": "Coconut Milk",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00005-00000-00000"
  },
  {
    "id": "oiweras037",
    "html": "Ginger",
    "tag": "category",
    "text": "Ginger",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00007-00000-00000"
  },
  {
    "id": "oiweras038",
    "html": "Lime",
    "tag": "category",
    "text": "Lime",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00009-00000-00000"
  },
  {
    "id": "oiweras039",
    "html": "Miso",
    "tag": "category",
    "text": "Miso",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00011-00000-00000"
  },
  {
    "id": "oiweras040",
    "html": "Rice",
    "tag": "category",
    "text": "Rice",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00013-00000-00000"
  },
  {
    "id": "oiweras041",
    "html": "Salmon",
    "tag": "category",
    "text": "Salmon",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00015-00000-00000"
  },
  {
    "id": "oiweras042",
    "html": "Dinner",
    "tag": "category",
    "text": "Dinner",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00017-00000-00000"
  },
  {
    "id": "oiweras043",
    "html": "Easy",
    "tag": "category",
    "text": "Easy",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00019-00000-00000"
  },
  {
    "id": "oiweras044",
    "html": "Quick",
    "tag": "category",
    "text": "Quick",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00021-00000-00000"
  },
  {
    "id": "oiweras045",
    "html": "Weeknight",
    "tag": "category",
    "text": "Weeknight",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00023-00000-00000"
  },
  {
    "id": "oiweras046",
    "html": "Main Course",
    "tag": "category",
    "text": "Main Course",
    "address": "00002-00013-00005-00001-00001-00001-00007-00001-00025-00000-00000"
  },
  {
    "id": "oiweras047",
    "html": "\n                <li>In a large pot, heat 2 tablespoons oil over medium. Add onion, ginger and garlic and season with salt and pepper. Cook, stirring occasionally, until softened, about 3 minutes. Add miso and cook, stirring frequently, until miso is lightly caramelized, about 2 minutes.</li>\n                <li>Add coconut milk and 3 cups water and bring to a boil over high heat. Cook until liquid is slightly reduced, about 5 minutes. Stir in salmon, reduce the heat to medium-low and simmer gently until just cooked through, about 5 minutes. Turn off heat and stir in spinach and lime juice.</li>\n                <li>Divide rice among bowls. Top with salmon curry, basil and cilantro. Serve with lime wedges for squeezing on top.</li>\n              ",
    "tag": "text",
    "text": "\n                In a large pot, heat 2 tablespoons oil over medium. Add onion, ginger and garlic and season with salt and pepper. Cook, stirring occasionally, until softened, about 3 minutes. Add miso and cook, stirring frequently, until miso is lightly caramelized, about 2 minutes.\n                Add coconut milk and 3 cups water and bring to a boil over high heat. Cook until liquid is slightly reduced, about 5 minutes. Stir in salmon, reduce the heat to medium-low and simmer gently until just cooked through, about 5 minutes. Turn off heat and stir in spinach and lime juice.\n                Divide rice among bowls. Top with salmon curry, basil and cilantro. Serve with lime wedges for squeezing on top.\n              ",
    "address": "00002-00013-00005-00001-00001-00001-00017-00005-00003-00000-00000"
  },
  {
    "id": "oiweras048",
    "html": "\n                <img src=\"https://static01.nyt.com/images/2019/02/20/dining/kc-miso-salmon-coconut-curry/merlin_150673143_c1eaa896-8f16-4688-9e2f-1de30b42c54c-articleLarge.jpg\" data-pin-media=\"https://static01.nyt.com/images/2019/02/20/dining/kc-miso-salmon-coconut-curry/kc-miso-salmon-coconut-curry-verticalTwoByThree735.jpg\" alt=\"Coconut-Miso Salmon Curry\">\n\n                  <p class=\"image-credit\">\n                    Julia Gartland for The New York Times. Food Stylist: Liza Jernow.\n                  </p>\n            ",
    "tag": "image",
    "text": "\n                \n\n                  \n                    Julia Gartland for The New York Times. Food Stylist: Liza Jernow.\n                  \n            ",
    "address": "00002-00013-00005-00001-00001-00001-00003-00001-00000-00000"
  }
]
export default parsedChunks

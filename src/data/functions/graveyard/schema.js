export default `
type Amount {
  amount : Float
  unit : String
  density : Float
  mL : Float
  g : Float
  recipe : Recipe
  ingredient : Ingredient
}

type NutrientDensity {
  description : String
  density : Float
  nutrient : [Nutrient]
  ingredient : [Ingredient]
}

type Nutrient {
  name : String
  kcal : Float
  densities : [NutrientDensity!]
  ingredients : [Ingredient]
}

type Book {
   title : String
}

type Source {
  name : String
  url : String
  recipe : Recipe
  book : Book
  page : Int 
  author : String
}

type TimeField {
  seconds : Int
  text : String
  recipe : Recipe
  type : String
}

type Ingredient {
  item : String
  amount : Amount @relation
  density : Float
  nutrient : Nutrient @relation
  nutrientDensity : NutrientDensity @relation
  shoppingName : String
  parent : Recipe
  reference : Recipe @relation
  isGroup : Boolean
  children : [Ingredient]
}

type Text {
  heading : String
  body : String!
  recipe : Recipe
}



type User {
  name : String
  email : String
}

type Image {
  uri : String
  alt : String
  thumbnailUri : String
  recipe : Recipe
}

type Recipe {
  title : String!
  images : [Image!]
  sources : [Source!] @relation
  yield : [Amount!] @relation
  category : [String!]
  times : [TimeField] @relation
  text : [Text]
  ingredients : [Ingredient] @relation
  collection: Collection
}

type Collection {
  user : User @relation
  recipes : [Recipe!]!
}
`

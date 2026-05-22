package data

type Unit string

const (
	UnitG    Unit = "g"
	UnitKG   Unit = "kg"
	UnitML   Unit = "ml"
	UnitL    Unit = "l"
	UnitPCS  Unit = "pcs"
	UnitTBSP Unit = "tbsp"
	UnitTSP  Unit = "tsp"
)

type Category string

const (
	CategoryMain       Category = "Hauptgericht"
	CategorySide       Category = "Beilage"
	CategoryBread      Category = "Brot"
	CategorySauce      Category = "Sauce"
	CategoryVegetarian Category = "Vegetarisch"
	CategoryVegan      Category = "Vegan"
	CategoryDrink      Category = "Getränk"
	CategoryBaked      Category = "Gebäck"
	CategoryAsian      Category = "Asia"
)

type Ingredient struct {
	Name   string  `json:"name"`
	Unit   Unit    `json:"unit"`
	Amount float64 `json:"amount"`
	Group  *string `json:"group,omitempty"`
}

type RecipeStep struct {
	OrderID int    `json:"order_id"`
	Step    string `json:"step"`
	Images  []int  `json:"images,omitempty"`
}

type Recipe struct {
	ID            int          `json:"id"`
	Title         string       `json:"title"`
	Description   *string      `json:"description,omitempty"`
	Portions      int          `json:"portions"`
	Ingredients   []Ingredient `json:"ingredients"`
	CookingTime   int          `json:"cooking_time"`
	Steps         []RecipeStep `json:"steps"`
	Categories    []Category   `json:"categories"`
	GalleryImages []int        `json:"gallery_images,omitempty"`
	CoverImage    *int         `json:"cover_image,omitempty"`
	CreatorName   *string      `json:"creator_name,omitempty"`
	CreatorID     *int         `json:"creator_id,omitempty"`
	Clicks        *int         `json:"clicks,omitempty"`
}

type RecipeListing struct {
	ID          int        `json:"id"`
	Title       string     `json:"title"`
	Creator     *string    `json:"creator,omitempty"`
	Description string     `json:"description"`
	Categories  []Category `json:"categories"`
	CoverImage  *int       `json:"cover_image,omitempty"`
	Rating      *float64   `json:"rating,omitempty"`
	Clicks      *int       `json:"clicks,omitempty"`
	CookingTime int        `json:"cooking_time"`
}

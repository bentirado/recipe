import React, { useState } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [foods, setFoods] = useState("");
  const [crave, setCrave] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCookClick = () => {
    setError(null);
    setRecipe(null);
    setLoading(true);

    axios.post("http://localhost:5000/scrape", { foods, crave })
      .then((response) => {
        if (response.data && typeof response.data === "object") {
          setRecipe(response.data);
        } else {
          setError("Invalid data format received from the backend.");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data from the backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleNewRecipeClick = () => {
    if (!recipe) return;
    setError(null);
    setLoading(true);

    // Pass the current recipe title as lastDish to ask for a different dish
    axios.post("http://localhost:5000/scrape", { foods, crave, lastDish: recipe.title })
      .then((response) => {
        if (response.data && typeof response.data === "object") {
          setRecipe(response.data);
        } else {
          setError("Invalid data format received from the backend.");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data from the backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="App">
      <h1>Abuelita's Kitchen</h1>
      <img src="/assets/Abuelita.png" alt="Abuelita" />
      
      <div className="inputBox">
        <textarea
          className="ingredientBox"
          rows="5"
          cols="40"
          placeholder="What ingredients do you have?"
          value={foods}
          onChange={(e) => setFoods(e.target.value)}
        />
        <textarea
          className="dishBox"
          rows="5"
          cols="40"
          placeholder="What would you like to make?"
          value={crave}
          onChange={(e) => setCrave(e.target.value)}
        />
      </div>
      
      <button onClick={handleCookClick} disabled={loading}>
        {loading ? "Cooking!" : "Cook!"}
      </button>

      {recipe && (
        <div>
          <div className="recipeDataBox">
            <h2>{recipe.title}</h2>
            <p>Author: {recipe.author}</p>
            <a href={recipe.link} target="_blank" rel="noopener noreferrer">
              View Recipe
            </a>
            {recipe.imageUrl && (
              <div>
                <img src={recipe.imageUrl} alt={recipe.title} width="300" />
              </div>
            )}
            <h3>Ingredients:</h3>
            <ul>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
            <h3>Directions:</h3>
            <ol>
              {recipe.directions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
          <button onClick={handleNewRecipeClick} disabled={loading}>
            {loading ? "Cooking!" : "Generate New Recipe"}
          </button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{"Lo siento mijo, but I don't have any recipes for that. Can you try giving me some more details?"}</p>}
    </div>
  );
}

export default App;

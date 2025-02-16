import React, { useEffect, useState } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [ingredientInput, setIngredientInput] = useState("");

  // Fetch data from the backend
  useEffect(() => {
    axios.get("http://localhost:5000/scrape")
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
      });
  }, []);

  const handleIngredientChange = (event) => {
    setIngredientInput(event.target.value);
  }

  const handleCookClick = () => {
    console.log("Ingredient Input:", ingredientInput);
  };

  return (
    <div className="App">
      <h1>Que Quieres, M'ijo?</h1>
      <img src="/assets/Abuelita.png" alt="Abuelita" />
      <div className="inputBox">
        <textarea className="ingredientBox" rows="10" cols="50" placeholder="What ingredients do you have?"></textarea>
        <textarea className="dishBox" rows="10" cols="50" placeholder="What would you like to make?"></textarea>
      </div>
      <button>Cook!</button>
      <div className="recipeDataBox">
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : recipe ? (
          <div>
            <h2>{recipe.title}</h2>
            <p>Author: {recipe.author}</p>
            <a href={recipe.link} target="_blank" rel="noopener noreferrer">
              View Recipe
            </a>
            <h3>Ingredients:</h3>
            <ul>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No recipe found.</p>
        )}
      </div>
    </div>
  );
}

export default App;

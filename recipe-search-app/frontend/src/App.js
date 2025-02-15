import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);

  // Fetch data from the backend
  useEffect(() => {
    axios.get("http://localhost:5000/scrape")
      .then((response) => {
        // Ensure the response data is an object
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

  return (
    <div>
      <h1>Recipe Search App</h1>
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
  );
}

export default App;
import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [recipes, setRecipes] = useState([]);

  // Fetch data from the backend
  useEffect(() => {
    axios.get("http://localhost:5000/scrape")
      .then((response) => {
        setRecipes(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <div>
      <h1>Recipe CHANGE I got it to work! App</h1>
      <ul>
        {recipes.map((recipe, index) => (
          <li key={index}>
            <a href={recipe.link} target="_blank" rel="noopener noreferrer">
              {recipe.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
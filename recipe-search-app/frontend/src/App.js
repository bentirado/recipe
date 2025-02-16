import React, { useState, useEffect } from "react";
import axios from "axios";
import './App.css';
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { Link } from "react-router-dom"; // Ensure React Router is set up

function App() {
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [foods, setFoods] = useState("");
  const [crave, setCrave] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null); // Track authentication state

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in as:", result.user.displayName);
    } catch (error) {
      console.error("Login error:", error.message);
      alert("Error logging in. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  const handleCookClick = () => {
    if (loading) return;
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
    if (loading || !recipe) return;
    setError(null);
    setLoading(true);

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
      <div className="header">
        <img src="/assets/chef-icon.svg" alt="Chef Icon" width="40" />
        <h1>Abuelita</h1>
        {/* Auth Button Logic */}
        {user ? (
          <div className="auth-buttons">
            <Link to="/saved-recipes" className="button">Saved Recipes</Link>
            <button className="logoutButton" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button className="loginButton" onClick={handleGoogleLogin}>Login with Google</button>
        )}
      </div>

      <p className="tagline">Let grandmother's wisdom guide your cooking!</p>
      
      <div className="inputBox">
        <p>What ingredients do you have?</p>
        <textarea
          className="ingredientBox"
          rows="5"
          cols="40"
          placeholder="What ingredients do you have?"
          value={foods}
          onChange={(e) => setFoods(e.target.value)}
        />
        <p>What would you like to make?</p>
        <textarea
          className="dishBox"
          rows="5"
          cols="40"
          placeholder="What would you like to make?"
          value={crave}
          onChange={(e) => setCrave(e.target.value)}
        />
      </div>
      
      <div className={`button ${loading ? 'disabled' : ''}`} onClick={handleCookClick}>
        {loading ? "Cooking!" : "Cook!"}
      </div>

      {recipe && (
        <div className="card">
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
          <div className={`button ${loading ? 'disabled' : ''}`} onClick={handleNewRecipeClick}>
            {loading ? "Cooking!" : "Generate New Recipe"}
          </div>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{"Lo siento mijo, but I don't have any recipes for that. Can you try giving me some more details?"}</p>}
    </div>
  );
}

export default App;

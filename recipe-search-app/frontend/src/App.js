import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import './App.css';

function App() {
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [foods, setFoods] = useState("");
  const [crave, setCrave] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error.message);
      alert("Error logging in. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  const handleCookClick = () => {
    if (loading) return;
    setError(null);
    setRecipe(null);
    setLoading(true);

    axios
      .post("http://localhost:5000/scrape", { foods, crave })
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
        <img src="/assets/chef-icon.svg" alt="Chef Icon" width="45" />
        <h1>Abuelita</h1>
        {/*}
        {user ? (
          <div className="auth-buttons">
            <button className="button" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button className="button" onClick={handleGoogleLogin}>Login with Google</button>
        )}*/}
      </div>

      <p className="tagline">Let grandmother's wisdom guide your cooking!</p>

      <div className="inputBox">
        <p>What ingredients do you have?</p>
        <textarea
          className="ingredientBox"
          rows="5"
          cols="40"
          placeholder="e.g., chicken, rice, tomatoes..."
          value={foods}
          onChange={(e) => setFoods(e.target.value)}
        />
        <p>What would you like to make?</p>
        <textarea
          className="dishBox"
          rows="5"
          cols="40"
          placeholder="e.g., something warm and comforting"
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
        </div>
      )}

      {error && <p style={{ color: "red" }}>{"Lo siento mijo, but I don't have any recipes for that. Can you try giving me some more details?"}</p>}
    </div>
  );
}

export default App;

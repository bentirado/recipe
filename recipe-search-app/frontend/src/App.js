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
    const handleNewRecipeClick = () => {
    if (loading || !recipe) return; // Prevent multiple clicks
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
        <p>What are you craving?</p>
        <textarea
          className="dishBox"
          rows="5"
          cols="40"
          placeholder="e.g., something warm and comforting"
          value={crave}
          onChange={(e) => setCrave(e.target.value)}
        />

      <div className="button-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
        <div className={`button ${loading ? 'disabled' : ''}`} onClick={handleCookClick}>
          {loading ? "Cooking!" : "Cook!"}
        </div>
      </div>
      </div>


      {recipe && (
        <div className="card">
          <div className="recipeDataBox">
            <h2>{recipe.title}</h2>
            <p className='author-text'>By: {recipe.author}</p>
            <a className="recipe-link" href={recipe.link} target="_blank" rel="noopener noreferrer">
              View Full Recipe
            </a>

            <h3>Ingredients:</h3>
            <ul>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="ingredient-item">{ingredient}</li>
              ))}
            </ul>
            <h3 style={{ paddingTop: '10px' }}>Directions:</h3>
            <ol>
              {recipe.directions.map((step, index) => (
                <li key={index} className="direction-item">{step}</li>
              ))}
            </ol>
            <div className="button-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '20px', paddingRight: '20px' }}>
              <div className={`button pastel-orange ${loading ? 'disabled' : ''}`} onClick={handleNewRecipeClick}>
                {loading ? "Cooking!" : "Generate New Recipe"}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p style={{ color: "black" }}>{"Lo siento mijo, but I don't have any recipes for that. Can you try giving me some more details?"}</p>}

      <footer style={{ textAlign: 'center', padding: '20px'}}>
        <p style={{}}>&copy; Made for 2025 Hacklahoma</p>
        <img src="/assets/Abuelita.png" alt="Abuelita" style={{ width: '80px', marginLeft: '10px' }} />
      </footer>
    </div>
    
  );
}

export default App;

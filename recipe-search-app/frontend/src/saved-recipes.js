import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase"; // Import Firebase
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SavedRecipes = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchSavedRecipes = async () => {
      const recipesRef = collection(db, "users", user.uid, "savedRecipes");
      const snapshot = await getDocs(recipesRef);
      const savedRecipes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecipes(savedRecipes);
    };

    fetchSavedRecipes();
  }, [user]);

  const handleDelete = async (recipeId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "savedRecipes", recipeId));
    setRecipes(recipes.filter((recipe) => recipe.id !== recipeId));
  };

  return (
    <div>
      <h1>Saved Recipes</h1>
      <button onClick={() => navigate("/")}>Back to Home</button>
      {recipes.length === 0 ? (
        <p>No saved recipes yet.</p>
      ) : (
        <ul>
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <h2>{recipe.title}</h2>
              <a href={recipe.link} target="_blank" rel="noopener noreferrer">
                View Recipe
              </a>
              <button onClick={() => handleDelete(recipe.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedRecipes;

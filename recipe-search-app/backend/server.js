const express = require("express");
const cors = require("cors");
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Modified getDishName now optionally excludes a dish
async function getDishName(ingredients, craving, excludeDish = null) {
  let prompt;
  if (excludeDish) {
    prompt = `Given the ingredients: ${ingredients} and craving ${craving}, suggest a dish that I can make that is different from ${excludeDish}. Answer with just the dish title in 5 words or less.`;
  } else {
    prompt = `Given the ingredients: ${ingredients} and craving ${craving}, suggest a dish that I can make. Answer with just the dish title in 5 words or less.`;
  }
  
  const openAIResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
  });
  
  return openAIResponse.choices[0]?.message.content.trim();
}

app.post("/scrape", async (req, res) => {
  let driver;
  try {
    // Destructure the incoming data; lastDish is optional
    const { foods, crave, lastDish } = req.body;
    if (!foods || !crave) {
      return res.status(400).json({ error: "Missing required fields: foods and crave." });
    }
    
    const options = new firefox.Options();
    options.addArguments("--headless");
    options.addArguments(
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options).build();
    
    // Step 1: Query OpenAI for a dish suggestion.
    let dishName = await getDishName(foods, crave, lastDish);
    let dishNameFormatted = dishName.replace(/ /g, "+");
    console.log("Formatted Dish Name for Search:", dishNameFormatted);
    
    const searchUrl = `https://www.allrecipes.com/search?q=${encodeURIComponent(dishNameFormatted)}`;
    console.log("Searching for:", dishName);
    await driver.get(searchUrl);
    
    try {
      await driver.wait(until.elementLocated(By.css(".mntl-card-list-card--extendable")), 20000);
    } catch (err) {
      console.error("Timeout occurred while waiting for search results");
      return res.status(404).json({ error: "No recipes found. Try refining your ingredients or craving." });
    }
    
    let recipeLinks = await driver.findElements(By.css(".mntl-card-list-card--extendable"));
    if (recipeLinks.length === 0) {
      // If first search yields nothing, try rewording the prompt (without excluding lastDish)
      console.log("No recipe found. Retrying with a reworded search...");
      dishName = await getDishName(foods, "a different variation of " + crave);
      dishNameFormatted = dishName.replace(/ /g, "+");
      const retrySearchUrl = `https://www.allrecipes.com/search?q=${encodeURIComponent(dishNameFormatted)}`;
      console.log("Retrying search with:", dishName);
      await driver.get(retrySearchUrl);
      await driver.wait(until.elementLocated(By.css(".mntl-card-list-card--extendable")), 20000);
      recipeLinks = await driver.findElements(By.css(".mntl-card-list-card--extendable"));
    }
    
    if (recipeLinks.length === 0) {
      await driver.quit();
      return res.status(404).json({
        error: "No suitable recipe found. Try refining your ingredients or choosing a different dish type.",
      });
    }
    
    let j = 0; // Initialize j

    for (let i = 0; i < recipeLinks.length; i++) {
      const recipeUrl = await recipeLinks[i].getAttribute("href"); // Use 'i' to loop through all links
      if (
        recipeUrl.toLowerCase().includes("great") ||
        recipeUrl.toLowerCase().includes("best-of") ||
        recipeUrl.toLowerCase().includes("guide")
      ) {
        console.log("This link contains one of the keywords (great, best-of, guide):", recipeUrl);
        j = 2; // Increment j when any of the keywords are found
      }
    }
    
    
    console.log("Final value of j:", j);
    
   
    // Proceed with scraping the first valid recipe (just for simplicity here)
    const selectedRecipeLinkElement = recipeLinks[j];
    const recipeUrl = await selectedRecipeLinkElement.getAttribute("href");
    console.log("Selected recipe URL:", recipeUrl);
    
    await driver.get(recipeUrl);
    
    // Scrape the title
    const title = await driver.findElement(By.css("h1.article-heading.text-headline-400")).getText();
    const link = await driver.getCurrentUrl();
    
    // Scrape the author
    let author = "Unknown";
    try {
      author = await driver.findElement(By.css("a.mntl-attribution__item-name")).getText();
    } catch (err) {
      console.warn("Author not found.");
    }
    
    // Scrape Ingredients
    await driver.wait(until.elementLocated(By.css("ul.mm-recipes-structured-ingredients__list")), 10000);
    const ingredients = await driver.findElements(By.css("ul.mm-recipes-structured-ingredients__list li"));
    const ingredientList = [];
    
    for (const ingredient of ingredients) {
      try {
        const paragraphElement = await ingredient.findElement(By.css("p"));
        
        const quantityElement = await paragraphElement.findElements(By.css("span[data-ingredient-quantity='true']"));
        const unitElement = await paragraphElement.findElements(By.css("span[data-ingredient-unit='true']"));
        const nameElement = await paragraphElement.findElements(By.css("span[data-ingredient-name='true']"));
        
        const quantity = quantityElement.length > 0 ? await quantityElement[0].getText() : "";
        const unit = unitElement.length > 0 ? await unitElement[0].getText() : "";
        const name = nameElement.length > 0 ? await nameElement[0].getText() : "";
        
        if (name) {
          ingredientList.push(`${quantity} ${unit} ${name}`.trim());
        }
      } catch (err) {
        console.warn("Skipping an ingredient due to missing data.");
      }
    }
    
    // Extract Directions
    await driver.wait(until.elementLocated(By.css("ol.comp.mntl-sc-block.mntl-sc-block-startgroup.mntl-sc-block-group--OL")), 10000);
    const steps = await driver.findElements(By.css("ol.comp.mntl-sc-block.mntl-sc-block-startgroup.mntl-sc-block-group--OL li"));
    
    const directions = [];
    for (const step of steps) {
      try {
        const paragraphElement = await step.findElement(By.css("p"));
        const stepText = await paragraphElement.getText();
        directions.push(stepText);
      } catch (err) {
        console.warn("Skipping a step due to missing text.");
      }
    }
    
    // Extract Image URL
    let imageUrl = "";
    try {
      const imageElement = await driver.findElement(By.css("img.universal-image__image"));
      imageUrl = await imageElement.getAttribute("src");
    } catch (err) {
      console.warn("Image not found.");
    }
    
    await driver.quit();
    res.json({ title, link, author, ingredients: ingredientList, directions, imageUrl });
    
  } catch (error) {
    console.error("Error scraping data:", error);
    if (driver) {
      await driver.quit();
    }
    res.status(500).send("Error scraping data");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

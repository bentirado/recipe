const express = require("express");
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const cors = require("cors");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = 5000;

app.use(cors());

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Load API Key from .env file
});

app.get("/", (req, res) => {
  res.send("Welcome to the Recipe Search Backend!");
});

app.get("/scrape", async (req, res) => {
  let driver;
  try {
    const options = new firefox.Options();
    options.addArguments("--headless");
    options.addArguments(
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    driver = await new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(options)
      .build();
    
    foods = 'Rice, beef, green peppers';
    crave = 'Somthing italian';

    // Step 1: Query OpenAI for recipe suggestion based on the ingredients
    const prompt = `Given the ingredients: ${foods} and craving ${crave}, suggest a dish that I can make. Answer with just the dish title in 5 words or less.`;

    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    let dishName = openAIResponse.choices[0].message.content.trim();
    console.log("Food Recommendation from OpenAI (Raw):", dishName);

    // Step 2: Modify the title format to 'Word+word+word'
    dishNameFormatted = dishName.replace(/ /g, '+');
    console.log("Formatted Dish Name for Search:", dishName);
    
    const searchQuery = "Enchilada+Beef"; // You can dynamically pass this query
    const searchUrl = `https://www.allrecipes.com/search?q=${encodeURIComponent(dishNameFormatted)}`;
    console.log("Searching for:", dishName);
    await driver.get(searchUrl);

    // Wait for recipe cards to be visiblye
    await driver.wait(until.elementLocated(By.css(".mntl-card-list-card--extendable")), 20000);

    // Select the first recipe card link (or change this to select based on other logic)
    const firstRecipeLinkElement = await driver.findElement(By.css(".mntl-card-list-card--extendable"));
    const recipeUrl = await firstRecipeLinkElement.getAttribute("href");
    console.log("Selected recipe URL:", recipeUrl);

    // Now navigate to the selected recipe's page
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

    // **Extract Ingredients**
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

    // **Extract Directions**
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

    await driver.quit();

    // Send the scraped data as JSON
    res.json({
      title,
      link,
      ingredients: ingredientList,
      directions,
      author,
    });
  } catch (error) {
    console.error("Error scraping data:", error);
    if (driver) {
      await driver.quit();
    }
    res.status(500).send("Error scraping data");
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

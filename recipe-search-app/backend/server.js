const express = require("express");
const { Builder, By } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const cors = require("cors");

const app = express();
const port = 5000;

// Enable CORS for all routes
app.use(cors());

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Recipe Search Backend!");
});

// Define a route to scrape recipes
app.get("/scrape", async (req, res) => {
  try {
    // Set up Selenium WebDriver for Firefox
    const options = new firefox.Options();
    options.addArguments("--headless"); // Set headless mode
    options.addArguments("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    const driver = await new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(options)
      .build();

    // Scrape data
    console.log("Navigating to: https://www.allrecipes.com/ploughman-s-sandwich-recipe-8737059");
    await driver.get("https://www.allrecipes.com/ploughman-s-sandwich-recipe-8737059");
    await driver.sleep(10000); // Wait 10 seconds for the page to load

    // Log the page title and HTML for debugging
    const pageTitle = await driver.getTitle();
    console.log("Page title:", pageTitle);
    const pageSource = await driver.getPageSource();
    console.log("Page HTML:", pageSource);

    // Scrape the recipe title
    const titleElement = await driver.findElement(By.css("h1.article-heading.text-headline-400"));
    const title = await titleElement.getText();

    // Scrape the recipe link (current page URL)
    const link = await driver.getCurrentUrl();

        // Scrape the author
        const authorElement = await driver.findElement(By.css("a.mntl-attribution__item-name"));
        const author = await authorElement.getText();

    // Scrape ingredients
    const ingredients = await driver.findElements(By.css("li.mm-recipes-structured-ingredients_list-item"));
    const ingredientList = [];
    for (const ingredient of ingredients) {
      const quantityElement = await ingredient.findElement(By.css("span[data-ingredient-quantity='true']")).getText();
      const unitElement = await ingredient.findElement(By.css("span[data-ingredient-unit='true']")).getText();
      const nameElement = await ingredient.findElement(By.css("span[data-ingredient-name='true']")).getText();
      const ingredientText = `${quantityElement} ${unitElement} ${nameElement}`;
      ingredientList.push(ingredientText);
    }

    await driver.quit();

    // Send the scraped data as JSON
    res.json({
      title,
      link,
      ingredients: ingredientList,
      author
    });
  } catch (error) {
    console.error("Error scraping data:", error);
    res.status(500).send("Error scraping data");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
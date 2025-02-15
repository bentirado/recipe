const express = require("express");
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());

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

    const url = "https://www.allrecipes.com/recipe/265338/birria-de-res-tacos-beef-birria-tacos/";
    console.log("Navigating to:", url);
    await driver.get(url);

    // Wait for page title to confirm it's loaded
    //await driver.wait(until.titleContains("Ploughman"), 10000);

    // Scrape title
    const title = await driver.findElement(By.css("h1.article-heading.text-headline-400")).getText();
    const link = await driver.getCurrentUrl();

    // Scrape author
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

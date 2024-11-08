import { chromium } from 'playwright';
import fs from 'fs';
import { Parser } from 'json2csv';

(async () => {

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://www.guiademidia.com.br/jornaisdesantacatarina.htm');

  
  const newspapers = await page.evaluate(() => {
    const newspaperElements = Array.from(document.querySelectorAll('a[href^="http"]')); // Select all links that start with http (why not https?)
    return newspaperElements.map(element => ({
      name: element.textContent.trim(),
      url: element.href
    }));
  });

  const results = [];


  for (const newspaper of newspapers) {
    try {
      console.log(`Checking newspaper: ${newspaper.name}`);
      await page.goto(newspaper.url);
      
    
      const articles = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.filter(link => link.textContent.toLowerCase().includes('corrupção')).map(link => ({  // Include more words
          title: link.textContent.trim(),
          url: link.href
        }));
      });

      for (const article of articles) {
        try {
          console.log(`Fetching article: ${article.title}`);
          await page.goto(article.url);

         
          const articleText = await page.evaluate(() => {
            return document.body;
          });

         
          results.push({
            newspaper: newspaper.name,
            title: article.title,
            url: article.url,
            text: articleText
          });

        } catch (err) {
          console.error(`Failed to fetch article: ${article.title} - ${err}`);
        }
      }
    } catch (err) {
      console.error(`Failed to check newspaper: ${newspaper.name} - ${err}`);
    }
  }

 
  // const parser = new Parser();
  // const json = parser.parse(results);
  const filePath = 'corruption_articles.json';
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`JSON file saved as ${filePath}`);


  await browser.close();
})();

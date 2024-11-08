import { chromium } from 'playwright';
import fs from 'fs';
import { Parser } from 'json2csv';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

(async () => {

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://www.guiademidia.com.br/jornaisdesantacatarina.htm');

  const newspapers = await page.evaluate(() => {
    const newspaperElements = Array.from(document.querySelectorAll('a')); 
    return newspaperElements.map(element => ({
      name: element.textContent.trim(),
      url: element.href
    }));
  });

  const results = [];
  const processedUrls = new Set();


  for (const newspaper of newspapers) {
    try {
      console.log(`Checking newspaper: ${newspaper.name}`);
      await page.goto(newspaper.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      const keywords = ['corrupcao', 'fraude', 'conluio', 'suborno', 'desvio']
    
      const articles = await page.evaluate((keywords) => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.filter(link => keywords.some(keyword => link.textContent.toLowerCase().includes(keyword.toLowerCase()))
          ).map(link => ({
            title: link.textContent.trim(),
            url: link.href
          }))
      }, keywords);

      for (const article of articles) {
        try {

          if (processedUrls.has(article.url)) {
            continue;
          }

          console.log(`Fetching article: ${article.title}`);
          await page.goto(article.url, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(3000); 

          const html = await page.content();
          const dom = new JSDOM(html);
          const reader = new Readability(dom.window.document);
          const articleData = reader.parse();
         
          results.push({
            newspaper: newspaper.name,
            title: article.title,
            url: article.url,
            date: articleData.publishedTime,
            text: articleData
          });

          processedUrls.add(article.url);

        } catch (err) {
          console.error(`Failed to fetch article: ${article.title} - ${err}`);
        }
      }
    } catch (err) {
      console.error(`Failed to check newspaper: ${newspaper.name} - ${err}`);
    }
  }

  const filePath = 'corruption_articles.json';
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`JSON file saved as ${filePath}`);

  await browser.close();
})();

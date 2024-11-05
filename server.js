import express from 'express';
import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const app = express();
const PORT = 3000;

app.get('/crawl', async (req, res) => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('https://www.guiademidia.com.br/jornaisdesantacatarina.htm', { waitUntil: 'domcontentloaded' });
        console.log('Página carregada com sucesso!');

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
                console.log(`Acessando o jornal: ${newspaper.name}`);
                await page.goto(newspaper.url, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(1000); // Espera 1 segundo

                const keywords = ['corrupcao', 'fraude', 'conluio', 'suborno', 'desvio'];

                const articles = await page.evaluate((keywords) => {
                    const links = Array.from(document.querySelectorAll('a'));
                    return links.filter(link => keywords.some(keyword => link.textContent.toLowerCase().includes(keyword.toLowerCase())))
                        .map(link => ({
                            title: link.textContent.trim(),
                            url: link.href
                        }));
                }, keywords);

                for (const article of articles) {
                    if (processedUrls.has(article.url)) {
                        continue;
                    }

                    console.log(`Acessando o artigo: ${article.title}`);
                    await page.goto(article.url, { waitUntil: 'domcontentloaded' });
                    await page.waitForTimeout(1000); // Espera 1 segundo
                    const html = await page.content();
                    const dom = new JSDOM(html);
                    const reader = new Readability(dom.window.document);
                    const articleData = reader.parse();
                    const articleText = articleData ? articleData.textContent.trim() : '';

                    results.push({
                        newspaper: newspaper.name,
                        title: article.title,
                        url: article.url,
                        text: articleText
                    });

                    processedUrls.add(article.url);
                }
            } catch (err) {
                console.error(`Erro ao processar o jornal: ${newspaper.name} - ${err.message}`);
            }
        }

        res.json(results);
    } catch (err) {
        console.error(`Erro ao carregar a página principal: ${err.message}`);
        res.status(500).json({ error: 'Erro ao carregar a página principal.' });
    } finally {
        await browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
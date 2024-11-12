import { chromium } from 'playwright';
import fs from 'fs';
import nlp from 'compromise';

(async () => {

  const browser = await chromium.launch();
  const mainPage = await browser.newPage();

  await mainPage.goto('https://www.guiademidia.com.br/jornaisdesantacatarina.htm');

  const newspapers = await mainPage.evaluate(() => {
    const newspaperElements = Array.from(document.querySelectorAll('.tabela-jornais a')); 
    return newspaperElements.map(element => ({
      name: element.textContent.trim(),
      url: element.href
    }));
  });

  const results = [];
  const processedUrls = new Set();
  const keywords = ['corrupcao', 'fraude', 'conluio', 'suborno', 'desvio']
  const scCities = ['Abdon Batista', 'Abelardo Luz', 'Agrolândia', 'Agronômica', 'Água Doce', 'Águas de Chapecó', 'Águas Frias',
                    'Águas Mornas', 'Alfredo Wagner', 'Alto Bela Vista', 'Anchieta', 'Angelina', 'Anita Garibaldi', 'Anitápolis',
                    'Antônio Carlos', 'Apiúna', 'Arabutã', 'Araquari', 'Araranguá', 'Armazém', 'Arroio Trinta', 'Arvoredo',
                    'Ascurra', 'Atalanta', 'Aurora', 'Balneário Arroio do Silva', 'Balneário Barra do Sul', 'Balneário Camboriú',
                    'Balneário Gaivota', 'Balneário Piçarras', 'Balneário Rincão', 'Bandeirante', 'Barra Bonita', 'Barra Velha',
                    'Bela Vista do Toldo', 'Belmonte', 'Benedito Novo', 'Biguaçu', 'Blumenau', 'Bocaina do Sul', 'Bom Jardim da Serra',
                    'Bom Jesus', 'Bom Jesus do Oeste', 'Bom Retiro', 'Bombinhas', 'Botuverá', 'Braço do Norte', 'Braço do Trombudo',
                    'Brunópolis', 'Brusque', 'Caçador', 'Caibi', 'Calmon', 'Camboriú', 'Campo Alegre', 'Campo Belo do Sul', 'Campo Erê',
                    'Campos Novos', 'Canelinha', 'Canoinhas', 'Capão Alto', 'Capinzal', 'Capivari de Baixo', 'Catanduvas', 'Caxambu do Sul',
                    'Celso Ramos', 'Cerro Negro', 'Chapadão do Lageado', 'Chapecó', 'Cocal do Sul', 'Concórdia', 'Cordilheira Alta', 'Coronel Freitas',
                    'Coronel Martins', 'Correia Pinto', 'Corupá', 'Criciúma', 'Cunha Porã', 'Cunhataí', 'Curitibanos', 'Descanso', 'Dionísio Cerqueira',
                    'Dona Emma', 'Doutor Pedrinho', 'Entre Rios', 'Ermo', 'Erval Velho', 'Faxinal dos Guedes', 'Flor do Sertão', 'Florianópolis', 'Formosa do Sul',
                    'Forquilhinha', 'Fraiburgo', 'Frei Rogério', 'Galvão', 'Garopaba', 'Garuva', 'Gaspar', 'Governador Celso Ramos', 'Grão-Pará',
                    'Gravatal', 'Guabiruba', 'Guaraciaba', 'Guaramirim', 'Guarujá do Sul', 'Guatambu', "Herval d'Oeste", 'Ibiam', 'Ibicaré', 'Ibirama',
                    'Içara', 'Ilhota', 'Imaruí', 'Imbituba', 'Imbuia', 'Indaial', 'Iomerê', 'Ipira', 'Iporã do Oeste', 'Ipuaçu', 'Ipumirim', 'Iraceminha', 
                    'Irani', 'Irati', 'Irineópolis', 'Itá', 'Itaiópolis', 'Itajaí', 'Itapema', 'Itapiranga', 'Itapoá', 'Ituporanga', 'Jaborá', 'Jacinto Machado',
                    'Jaguaruna', 'Jaraguá do Sul', 'Jardinópolis', 'Joaçaba', 'Joinville', 'José Boiteux', 'Jupiá', 'Lacerdópolis', 'Lages', 'Laguna', 'Lajeado Grande', 
                    'Laurentino', 'Lauro Müller', 'Lebon Régis', 'Leoberto Leal', 'Lindóia do Sul', 'Lontras', 'Luiz Alves', 'Luzerna', 'Macieira', 'Mafra', 'Major Gercino',
                    'Major Vieira', 'Maracajá', 'Maravilha', 'Marema', 'Massaranduba', 'Matos Costa', 'Meleiro', 'Mirim Doce', 'Modelo', 'Mondaí', 'Monte Carlo', 'Monte Castelo',
                    'Morro da Fumaça', 'Morro Grande', 'Navegantes', 'Nova Erechim', 'Nova Itaberaba', 'Nova Trento', 'Nova Veneza', 'Novo Horizonte', 'Orleans',
                    'Otacílio Costa', 'Ouro', 'Ouro Verde', 'Paial', 'Painel', 'Palhoça', 'Palma Sola', 'Palmeira', 'Palmitos', 'Papanduva', 'Paraíso', 'Passo de Torres',
                    'Passos Maia', 'Paulo Lopes', 'Pedras Grandes', 'Penha', 'Peritiba', 'Pescaria Brava', 'Petrolândia', 'Pinhalzinho', 'Pinheiro Preto', 'Piratuba', 'Planalto Alegre',
                    'Pomerode', 'Ponte Alta', 'Ponte Alta do Norte', 'Ponte Serrada', 'Porto Belo', 'Porto União', 'Pouso Redondo', 'Praia Grande', 'Presidente Castello Branco',
                    'Presidente Getúlio', 'Presidente Nereu', 'Princesa', 'Quilombo', 'Rancho Queimado', 'Rio das Antas', 'Rio do Campo', 'Rio do Oeste', 'Rio do Sul', 'Rio dos Cedros',
                    'Rio Fortuna', 'Rio Negrinho', 'Rio Rufino', 'Riqueza', 'Rodeio', 'Romelândia', 'Salete', 'Saltinho', 'Salto Veloso', 'Sangão', 'Santa Cecília', 'Santa Helena', 'Santa Rosa de Lima',
                    'Santa Rosa do Sul',  'Santa Terezinha', 'Santa Terezinha do Progresso', 'Santiago do Sul', 'Santo Amaro da Imperatriz', 'São Bento do Sul', 'São Bernardino',
                    'São Bonifácio', 'São Carlos', 'São Cristóvão do Sul', 'São Domingos', 'São Francisco do Sul', 'São João Batista', 'São João do Itaperiú', 'São João do Oeste',
                    'São João do Sul', 'São Joaquim', 'São José', 'São José do Cedro', 'São José do Cerrito', 'São Lourenço do Oeste', 'São Ludgero', 'São Martinho', 'São Miguel da Boa Vista',
                    'São Miguel do Oeste', 'São Pedro de Alcântara', 'Saudades', 'Schroeder', 'Seara', 'Serra Alta', 'Siderópolis', 'Sombrio', 'Sul Brasil', 'Taió', 'Tangará', 'Tigrinhos',
                    'Tijucas', 'Timbó', 'Timbó Grande', 'Três Barras', 'Treviso', 'Treze de Maio', 'Treze Tílias',  'Trombudo Central', 'Tubarão', 'Tunápolis', 'Turvo', 'União do Oeste', 'Urubici',
                    'Urupema', 'Urussanga', 'Vargeão', 'Vargem', 'Vargem Bonita', 'Vidal Ramos', 'Videira', 'Vitor Meireles', 'Witmarsum', 'Xanxerê', 'Xavantina', 'Xaxim', 'Zortéa'];

  for (const newspaper of newspapers) {
    const page = await browser.newPage();
    try {
      console.log(`Checking newspaper: ${newspaper.name}`);
      await page.goto(newspaper.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
    
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
          await page.goto(article.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(5000);

          const articleText = await page.evaluate(() => {
            return document.documentElement.outerHTML;
          });

          const articleDate = await page.evaluate(() => {
            return document.querySelector('.date, .published-date, .published, .post-date, .data-post, .data, .td-post-date, .jeg_meta_date')?.innerText;
          });

          const content = await page.evaluate(() => {
            return document.documentElement.innerText;
          });

          const aux = nlp(content);
          const cities = aux.places().out('array');
          console.log(`Cidades: ${cities}`);

          const foundSCCities = cities.filter(city => scCities.some(c => c.toLowerCase().trim() === city.toLowerCase().trim()));
          console.log(`Cidades encontradas: ${foundSCCities}`)

          const people = aux.people().out('array');
          const organizations = aux.organizations().out('array');

          results.push({
            newspaper: newspaper.name,
            title: article.title,
            url: article.url,
            // text: articleText,
            date: articleDate,
            cities: foundSCCities,
            people: people,
            organizations: organizations
          });

          processedUrls.add(article.url);

        } catch (err) {
          console.error(`Failed to fetch article: ${article.title} - ${err}`);
          break;
        }
      }
    } catch (err) {
      console.error(`Failed to check newspaper: ${newspaper.name} - ${err}`);
    } finally {
      await page.close();
    }
  }

  const filePath = 'corruption_articles.json';
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`JSON file saved as ${filePath}`);

  await mainPage.close();
  await browser.close();
})();

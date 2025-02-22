import { chromium } from 'playwright';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function updateJson(newResults) {
  let existingData = [];
  const filePath = 'corruption_articles.json';

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    existingData = JSON.parse(fileContent);
  }

  const updatedData = existingData.concat(newResults);

  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
};

const loadProcessedUrls = (filePath) => { // Carrega arquivo com as URLs das notícias que já foram coletadas
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return new Set(JSON.parse(data));
  }
  return new Set();
};

const sendLogToFlask = async (message) => {
  try {
    await axios.post(`${process.env.FLASK_URL}/log`, {message});
  } catch (err) {
    console.error('Erro ao enviar log para o Flask: ', err);
  }
};

const saveProcessedUrls = (filePath, processedUrls) => { // Salva no arquivo as novas URLs coletadas
  fs.writeFileSync(filePath, JSON.stringify(Array.from(processedUrls), null, 2));
};

const runCrawler = (async () => {

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
  const processedUrlsFilePath = 'processed_urls.json'
  const processedUrls = loadProcessedUrls(processedUrlsFilePath);
  const keywords = ["corrupção", "fraude", "conluio", "suborno", "propina", "desvio de verba", "malversação", "lavagem de dinheiro", "peculato", "tráfico de influência", "enriquecimento ilícito", "abuso de poder", "improbidade administrativa", "cartel", "superfaturamento", "sonegação fiscal", "evasão de divisas", "delação premiada", "denúncia anônima", "mandado de busca", "inquérito", "cooperação internacional", "delator", "tribunal de contas", "controladoria", "acordo de leniência", "impunidade", "deliberação", "crime financeiro", "processo judicial", "mandado de prisão", "investigação federal", "justiça federal", "tribunal superior", "político envolvido", "setor público", "ONGs envolvidas", "compliance", "integridade corporativa", "manipulação de mercado", "fraude contábil", "evasão de impostos", "conflito de interesses", "fundos desviados", "caixa dois", "fraude fiscal", "paraísos fiscais", "contratos superfaturados", "contratos públicos", "licitações fraudulentas", "aditivos contratuais", "contas bloqueadas", "contas offshore", "fundos ilícitos", "patrimônio não declarado", "bens confiscados"];
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
      await sendLogToFlask(`Checking newspaper: ${newspaper.name}`);
      console.log(`Checking newspaper: ${newspaper.name}`);
      await page.goto(newspaper.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
      
      const articles = await page.evaluate((keywords) => { // Procura notícias com as palavras chave
        const links = Array.from(document.querySelectorAll('a'));
        return links.flatMap(link => {
          const foundKeywords = keywords.filter(keyword => link.textContent.toLowerCase().includes(keyword.toLowerCase()));
          return foundKeywords.length > 0 ? {
            title: link.textContent.trim(),
            url: link.href,
            keywords: foundKeywords
          }: [];
        });
      }, keywords);

      for (const article of articles) {
        try {
          if (processedUrls.has(article.url)) {
            continue;
          }

          await sendLogToFlask(`Fetching article: ${article.title}`);
          console.log(`Fetching article: ${article.title}`);
          await page.goto(article.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(5000);

          const articleText = await page.evaluate(() => {
            return document.documentElement.outerHTML;
          });

          const articleDate = await page.evaluate(() => {
            return document.querySelector('.date, .published-date, .published, .post-date, .data-post, .data, .td-post-date, .jeg_meta_date, .post__data__published, .meta-date, .datas_interno, .entry-date')?.innerText;
          });

          const cleanHtml = await page.evaluate(() => { // Coleta o texto interno do site, para melhor coleta dos dados
            const scripts = document.querySelectorAll('script, style');
            scripts.forEach(script => script.remove());
            return document.documentElement.outerHTML;
          });

          const dom = new JSDOM(cleanHtml);
          const reader = new Readability(dom.window.document);
          const articleData = reader.parse()
            
          processedUrls.add(article.url);

          const foundSCCities = scCities.filter(city => {
            const regex = new RegExp(`\\b${city}\\b`, 'i');
            return regex.test(articleData) || regex.test(article.title);
          });

          if (foundSCCities.length === 0) { // Testa se alguma cidade de SC é mencionada no corpo da notícia
            console.log('No SC city found.');
            continue;
          } else {
            console.log('Cidades: ', foundSCCities)
          };

          const regx = /(?:R\$|\$)\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?(?:\s*(mil|milhões|bilhões|reais|dólares))?/gi;
          const monetary_value = articleData.textContent.match(regx); // Procura valores monetários

          const reg = /promotor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
          const prosecutor = articleData.textContent.match(reg); // Procura a menção de algum promotor

          const response = await fetch(`${process.env.FLASK_URL}/extract_entities`, { // Chama a API que contém o Spacy, para coleta de pessoas e empresas
            method: 'POST',
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify({text: articleData.textContent})
          });

          const entities = await response.json();
          let people = entities.people;
          let organizations = entities.organizations;

          people = people.filter(person => !scCities.includes(person));
          organizations = organizations.filter(organization => !scCities.includes(organization));

          results.push({ //Sobe os resultados obtidos
            newspaper: newspaper.name,
            title: article.title,
            url: article.url,
            text: articleText,
            date: articleDate || null, 
            cities: foundSCCities,
            people: people, 
            organizations: organizations,
            fraud: article.keywords,
            value: monetary_value || null,
            prosecutor: prosecutor || null
          });

          processedUrls.add(article.url);

        } catch (err) {
          await sendLogToFlask(`Failed to fetch article: ${article.title} - ${err}`);
          console.error(`Failed to fetch article: ${article.title} - ${err}`);
          break;
        }
      }
    } catch (err) {
      await sendLogToFlask(`Failed to check newspaper: ${newspaper.name} - ${err}`);
      console.error(`Failed to check newspaper: ${newspaper.name} - ${err}`);
    } finally {
      await page.close();
    }
  }

  const sendResultsToApp = async (results) => { // Envia os resultados para a rota que os mostra na aplicação React
    try {
      await axios.post(`${process.env.FLASK_URL}/add_results`, results);
      console.log('Resultados enviados para o Flask com sucesso.');
    } catch (err) {
      console.error('Erro ao enviar results: ', err);
    }
  };

  saveProcessedUrls(processedUrlsFilePath, processedUrls);

  updateJson(results);
  // fs.writeFileSync(filePath, JSON.stringify(results, null, 2)); // Atualiza arquivo JSON
  await sendResultsToApp(results);
  console.log('JSON file updated');

  await mainPage.close();
  await browser.close();
});

runCrawler().catch(err => {
  sendLogToFlask(`Error running the crawler: ${err}`);
  console.error(`Error running the crawler: ${err}`);
});

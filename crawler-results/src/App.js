import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ResultsTable from './ResultsTable';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import InitCrawler from './InitCrawler';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCrawlerRunning, setIsCrawlRunning] = useState(false);

  const fetchResults = async () => {
    try {
      const response = await axios.get('http://localhost:5000/results'); 
      setResults(response.data);
    } catch (err) {
      setError('Erro ao buscar resultados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isCrawlerRunning) {
        fetchResults();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isCrawlerRunning]);

  const handleCrawlerStart = () => {
    setIsCrawlRunning(true);
    fetchResults();  
  };

  useEffect(() => {
    fetchResults();
  },[]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Container >
      <Row>
        <InitCrawler onCrawlerStart={handleCrawlerStart}/>
      </Row>
      <Row>
        <h2>Resultados do Crawler</h2>
        <ResultsTable results={results} />
      </Row>
    </Container>
  );
}

export default App;
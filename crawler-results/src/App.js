import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ResultsTable from './ResultsTable'; 

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get('http://localhost:5000/results'); 
        setResults(response.data);
        console.log(response.data);
      } catch (err) {
        setError('Erro ao buscar resultados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className='justify-content-center'>
      <div>
        <h1>Resultados do Crawler</h1>
        <ResultsTable results={results} />
      </div>
    </div>
  );
}

export default App;
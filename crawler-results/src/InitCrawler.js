import React, {use, useEffect, useState} from 'react';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import './App.css';

function InitCrawler({onCrawlerStart}) {
    const [message, setMessage] = useState('');
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);

    const handleRunCrawler = async () => {
        try {
            const response = await fetch('http://localhost:5000/run_crawler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                setShowLogs(true);
                onCrawlerStart();
            } else {
                setMessage(data.error);
            }
        } catch (err) {
            setMessage('Erro ao iniciar crawler: ', err.message);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await fetch('http://localhost:5000/logs');
            const data = await response.json();
            setLogs(data.logs);
        } catch (err) {
            console.error('Erro ao buscar logs: ', err);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (showLogs) {
                fetchLogs();
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [showLogs]);

    return (
      <div className='title'>
          <h1>Projeto Céos</h1>
          <h2>Crawler para coleta de notícias sobre corrupção no estado de SC</h2>
          <Button variant='secondary' size='lg' onClick={handleRunCrawler}> Iniciar Crawler</Button>
          {message && (
            <Alert variant={message.includes('Erro') ? 'danger' : 'sucess'}>
                {message}
            </Alert>
          )}
          {showLogs && (
            <div>
                <h3>Logs do Crawler: </h3>
                <div className='logs-container'>
                    <ul className='logs-list'>
                        {logs.map((log, index) => (
                            <li key={index}>{log}</li>
                        ))}
                    </ul>
                </div>
            </div>
          )}
      </div>
    );
}

export default InitCrawler;
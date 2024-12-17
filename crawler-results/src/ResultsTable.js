import React from 'react';
import Table from 'react-bootstrap/Table';

function ResultsTable({ results }) {
  return (
    <Table striped bordered  variant='dark'>
      <thead>
        <tr>
          <th>Jornal</th>
          <th>Título</th>
          <th>URL</th>
          <th>Cidades</th>
          <th>Pessoas</th>
          <th>Organizações</th>
          <th>Fraude</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result, index) => (
          <tr key={index}>
            <td>{result.newspaper}</td>
            <td>{result.title}</td>
            <td><a href={result.url} target="_blank" rel="noopener noreferrer">Link</a></td>
            <td>{result.cities.join(', ')}</td>
            <td>{result.people.join(', ')}</td>
            <td>{result.organizations.join(', ')}</td>
            <td>{result.fraud.join(', ')}</td>
            <td>{result.value ? result.value.join(', ') : 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </Table >
  );
}

export default ResultsTable;
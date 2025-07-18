
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBox from './components/SearchBox';
import DefinitionCard from './components/DefinitionCard';
import HistoryPanel from './components/HistoryPanel';
import './App.css';

function App() {
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const searchWord = async (word) => {
    if (!word.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: { word: word.trim() }
      });
      setSearchResult(response.data);
      fetchHistory(); // Refresh history after search
    } catch (error) {
      console.error('Error searching word:', error);
      setSearchResult({
        word: word,
        found: false,
        definitions: [],
        suggestions: [],
        error: 'Failed to search. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRandomWord = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/random`);
      setSearchResult(response.data);
      fetchHistory();
    } catch (error) {
      console.error('Error getting random word:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFromHistory = async (word) => {
    try {
      await axios.post(`${API_BASE}/delete`, { word });
      fetchHistory(); // Refresh history
    } catch (error) {
      console.error('Error deleting from history:', error);
    }
  };



  const searchFromHistory = (word) => {
    searchWord(word);
    setShowHistory(false);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>📖 TrojanHub</h1>
        <p>Discover meanings, explore words</p>
      </header>

      <main className="app-main">
        <div className="search-section">
          <div className="results-section">
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Searching...</p>
              </div>
            )}

            {searchResult && !loading && (
              <DefinitionCard 
                result={searchResult}
                onSuggestionClick={searchWord}
              />
            )}

            {!searchResult && !loading && (
              <div className="welcome-message">
                <h2>Welcome to the Interactive Search Engine! 🎯</h2>
                <p>Search for any word to get started, or try a random word to explore.</p>
                <div className="features">
                  <div className="feature">
                    <h3>🔍 Smart Search</h3>
                    <p>Get definitions with examples and images</p>
                  </div>
                  <div className="feature">
                    <h3>📝 Search History</h3>
                    <p>Keep track of the meanings you searched</p>
                  </div>
                  <div className="feature">
                    <h3>🎲 Random Words</h3>
                    <p>Discover new words randomly</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SearchBox 
            onSearch={searchWord}
            onRandomWord={getRandomWord}
            loading={loading}
          />
          

          <div className="action-buttons">
            <button 
              className="history-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              📚 Search History ({history.length})
            </button>
          </div>
        </div>

        {showHistory && (
          <HistoryPanel 
            history={history}
            onWordClick={searchFromHistory}
            onClose={() => setShowHistory(false)}
            onDeleteWord={deleteFromHistory}
          />
        )}
        
      </main>

      <footer className="app-footer">
        <p>Built with React & Python Flask | Interactive Dictionary v1.0</p>
      </footer>
    </div>
  );
}

export default App;
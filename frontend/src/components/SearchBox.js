
import React, { useState } from 'react';

function SearchBox({ onSearch, onRandomWord, loading }) {
  const [word, setWord] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (word.trim()) {
      onSearch(word);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="search-box">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a word to search..."
            className="search-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="search-btn"
            disabled={loading || !word.trim()}
          >
            🔍 Search
          </button>
        </div>
      </form>
      
      <button 
        onClick={onRandomWord}
        className="random-btn"
        disabled={loading}
      >
        🎲 Random Word
      </button>
    </div>
  );
}

export default SearchBox;
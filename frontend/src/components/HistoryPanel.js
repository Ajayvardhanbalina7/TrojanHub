
import React from 'react';

function HistoryPanel({ history, onWordClick, onClose, onDeleteWord }) {
  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>📚 Search History</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>
      
      {history.length === 0 ? (
        <p className="no-history">No search history yet. Start searching for words!</p>
      ) : (
        <div className="history-list">
          {history.map((item, index) => (
            <div key={index} className="history-item">
              <div className='history-item-1'>
                <button
                  onClick={() => onWordClick(item.word)}
                  className="history-word-btn"
                >
                  <strong>{item.word}</strong>
                  <span className="definition-count">
                    {item.definitions.length} definition{item.definitions.length !== 1 ? 's' : ''}
                  </span>
                </button>
              </div>
              <div className='history-item-2'>
                <button 
                  className="delete-btn" 
                  onClick={() => onDeleteWord(item.word)}
                  title="Remove from history"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
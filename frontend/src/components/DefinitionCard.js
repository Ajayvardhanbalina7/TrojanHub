import React from 'react';

function DefinitionCard({ result, onSuggestionClick }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="definition-card error">
        <h2>❌ Error</h2>
        <p>{result.error}</p>
      </div>
    );
  }

  if (!result.found) {
    return (
      <div className="definition-card not-found">
        <h2>🤔 Word Not Found</h2>
        <p>Sorry, we couldn't find "<strong>{result.word}</strong>" in our dictionary.</p>

        {result.suggestions && result.suggestions.length > 0 && (
          <div className="suggestions">
            <h3>💡 Did you mean:</h3>
            <div className="suggestion-buttons">
              {result.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="suggestion-btn"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="definition-card found">
      <h2 className="word-title">📝 {toTitleCase(result.word)}</h2>

      <div className="definitions">
        {result.definitions.map((def, index) => (
          <div key={index} className="definition-item">
            <div className="definition-header">
              <span className="part-of-speech">{def.type}</span>
            </div>
            <p className="definition-text">{def.definition}</p>
            {def.example && (
              <div className="example">
                <strong>Example:</strong> <em>"{def.example}"</em>
              </div>
            )}
          </div>
        ))}
      </div>

      {result.image_url && (
        <div className="result-image">
          <img src={result.image_url} alt={`Illustration of ${result.word}`} />
        </div>
      )}

      {result.extra_info && (
        <div className="extra-info">
          <h3>📚 Extra Info</h3>
          <p dangerouslySetInnerHTML={{ __html: result.extra_info }}></p>
        </div>
      )}
    </div>
  );
}
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default DefinitionCard;
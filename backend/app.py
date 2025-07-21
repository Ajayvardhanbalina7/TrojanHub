from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import random
import urllib.parse
import os
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Environment Variables
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY")
PEXELS_API_URL = os.environ.get("PEXELS_API_URL", "https://api.pexels.com/v1/search")


class DictionaryAPI:
    def __init__(self):
        self.dictionary = {}
        self.search_history = []

    def search_word(self, word):
        word = word.strip().lower()

        if word in self.dictionary:
            definitions = self.dictionary[word]
            image_url = self.fetch_image(word)
            self.add_to_history(word, definitions)
            return self.build_response(word, definitions, image_url)

        try:
            response = requests.get(f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}', timeout=10)
            response.raise_for_status()
            data = response.json()

            definitions = []
            for meaning in data[0]['meanings']:
                for d in meaning['definitions']:
                    definitions.append({
                        'type': meaning['partOfSpeech'],
                        'definition': d['definition'],
                        'example': d.get('example', '')
                    })

            image_url = self.fetch_image(word)
            self.dictionary[word] = definitions
            self.add_to_history(word, definitions)
            return self.build_response(word, definitions, image_url=image_url)

        except requests.RequestException as e:
            print(f"[DictionaryAPI Error] {e}")
            return self.fetch_from_external_sources(word)

    def fetch_from_external_sources(self, word):
        word = word.strip().lower()

        summary, image_url = self.fetch_from_wikipedia(word)
        if summary:
            definitions = [{'type': 'info', 'definition': summary, 'example': ''}]
            self.dictionary[word] = definitions
            self.add_to_history(word, definitions)
            return self.build_response(word, definitions, image_url)

        about, image_url = self.fetch_from_jikan(word)
        if about:
            definitions = [{'type': 'character', 'definition': about, 'example': ''}]
            self.dictionary[word] = definitions
            self.add_to_history(word, definitions)
            return self.build_response(word, definitions, image_url)

        wikidata_summary = self.fetch_from_wikidata(word)
        if wikidata_summary:
            image_url = self.fetch_image(word)
            definitions = [{'type': 'wikidata', 'definition': wikidata_summary, 'example': ''}]
            self.dictionary[word] = definitions
            self.add_to_history(word, definitions)
            return self.build_response(word, definitions, image_url)

        duck_result = self.fetch_image_duckduckgo(word)
        if duck_result:
            image_url = self.fetch_image(word)
            definitions = [{'type': 'duckduckgo', 'definition': duck_result, 'example': ''}]
            self.dictionary[word] = definitions
            self.add_to_history(word, definitions)
            return self.build_response(word, definitions, image_url)

        return {
            'word': word,
            'definitions': [],
            'found': False,
            'suggestions': []
        }

    def fetch_from_wikipedia(self, word):
        try:
            encoded_word = urllib.parse.quote(word)
            url = (
                f"https://en.wikipedia.org/w/api.php?action=query&format=json"
                f"&prop=extracts|pageimages&exintro=true&explaintext=true"
                f"&titles={encoded_word}&pithumbsize=500&redirects=1"
            )
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                pages = response.json().get("query", {}).get("pages", {})
                for page in pages.values():
                    if "missing" not in page:
                        summary = page.get("extract")
                        image_url = page.get("thumbnail", {}).get("source")
                        return summary, image_url
        except Exception as e:
            print(f"[Wikipedia Error] {e}")
        return None, None

    def fetch_from_jikan(self, word):
        try:
            res = requests.get(f'https://api.jikan.moe/v4/characters?q={word}&limit=5', timeout=10)
            if res.status_code == 200:
                data = res.json().get('data', [])
                for character in data:
                    if character['name'].strip().lower() == word.lower():
                        return character.get('about'), character['images']['jpg']['image_url']
        except Exception as e:
            print(f"[Jikan Error] {e}")
        return None, None

    def fetch_from_wikidata(self, word):
        try:
            url = f'https://www.wikidata.org/w/api.php?action=wbsearchentities&search={word}&language=en&format=json'
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if data.get('search'):
                    return data['search'][0].get('description')
        except Exception as e:
            print(f"[Wikidata Error] {e}")
        return None

    def fetch_image_duckduckgo(self, query):
        try:
            res = requests.get(
                f"https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1},
                timeout=5
            )
            if res.status_code == 200:
                data = res.json()
                return data.get("Image")
        except Exception as e:
            print(f"[DuckDuckGo Image Error] {e}")
        return None

    def fetch_image(self, query):
        if not PEXELS_API_KEY:
            print("[ERROR] PEXELS_API_KEY is not set.")
            return None
        try:
            headers = {'Authorization': PEXELS_API_KEY}
            res = requests.get(f'{PEXELS_API_URL}?query={query}&per_page=1', headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if data['photos']:
                    return data['photos'][0]['src']['medium']
        except Exception as e:
            print(f"[Pexels Error] {e}")
        return None

    def build_response(self, word, definitions, image_url=None):
        return {
            'word': word,
            'definitions': definitions,
            'found': bool(definitions),
            'suggestions': [],
            'image_url': image_url
        }

    def add_to_history(self, word, definitions):
        entry = {'word': word, 'definitions': definitions}
        if entry not in self.search_history:
            self.search_history.insert(0, entry)
            self.search_history = self.search_history[:10]

    def delete_from_history(self, word):
        self.search_history = [item for item in self.search_history if item['word'] != word]


dictionary_api = DictionaryAPI()

@app.route('/api/search', methods=['GET'])
def search_word():
    word = request.args.get('word', '')
    if not word:
        return jsonify({'error': 'No word provided'}), 400
    return jsonify(dictionary_api.search_word(word))

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(dictionary_api.search_history)

@app.route('/api/delete', methods=['POST'])
def delete_word():
    word = request.json.get('word')
    dictionary_api.delete_from_history(word)
    return jsonify({'status': 'deleted'})

@app.route('/api/random', methods=['GET'])
def random_word():
    related_words = set()
    for entry in dictionary_api.search_history:
        for definition in entry['definitions']:
            example = definition.get('example', '')
            text = f"{definition['definition']} {example}".lower()
            for w in text.split():
                w = w.strip(".,?!\"'()[]{}").lower()
                if len(w) > 4 and w not in dictionary_api.dictionary:
                    related_words.add(w)

    related_words = list(related_words)
    if related_words:
        random_word = random.choice(related_words)
    else:
        fallback_words = [
            "technology", "innovation", "nature", "language", "science",
            "emotion", "future", "education", "creativity", "freedom"
        ]
        random_word = random.choice(fallback_words)

    result = dictionary_api.search_word(random_word)
    return jsonify(result)

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

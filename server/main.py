import os
import json
import requests
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from urllib.parse import urlparse, parse_qs

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Lista e autorëve për Babi Arbenin
AUTHORS = [
    "Marcus Aurelius", "Seneca", "Epictetus", "Aristotle", "Plato", "Socrates", 
    "Lao Tzu", "Buddha", "Confucius", "Rumi", "Khalil Gibran", "Friedrich Nietzsche", 
    "Henry David Thoreau", "Mahatma Gandhi", "Martin Luther King Jr.", "Carl Jung", 
    "Viktor Frankl", "Jordan Peterson", "Carol Dweck", "David Goggins", "Jocko Willink", 
    "Tony Robbins", "Mel Robbins", "Eckhart Tolle", "James Clear"
]

def extract_video_id(url):
    try:
        query = urlparse(url)
        if query.hostname == 'youtu.be': return query.path[1:]
        if query.hostname in ('www.youtube.com', 'youtube.com'):
            if query.path == '/watch':
                p = parse_qs(query.query)
                return p['v'][0]
            if query.path[:7] == '/embed/': return query.path.split('/')[2]
            if query.path[:3] == '/v/': return query.path.split('/')[2]
    except: return None
    return None

def get_transcript_from_rapidapi(video_id):
    api_key = os.environ.get("RAPIDAPI_KEY")
    api_host = os.environ.get("RAPIDAPI_HOST", "youtube-transcripts.p.rapidapi.com")
    
    if not api_key: raise Exception("Mungon RAPIDAPI_KEY në server.")

    url = f"https://{api_host}/youtube/transcript"
    querystring = {"url": f"https://www.youtube.com/watch?v={video_id}"}
    headers = { "X-RapidAPI-Key": api_key, "X-RapidAPI-Host": api_host }

    response = requests.get(url, headers=headers, params=querystring)
    if response.status_code != 200: raise Exception(f"RapidAPI Error: {response.text}")
        
    data = response.json()
    full_text = ""
    if "content" in data: full_text = " ".join([item['text'] for item in data['content']])
    elif isinstance(data, list): full_text = " ".join([item['text'] for item in data])
    else: full_text = str(data)
    return full_text

@app.route('/', methods=['GET'])
def home(): return "Serveri punon!"

# --- ENDPOINT I RI PËR SHPREHJET ---
@app.route('/api/daily-quote', methods=['GET'])
def get_quote():
    try:
        author = random.choice(AUTHORS)
        
        prompt = f"""
        Gjej një shprehje të famshme, të fuqishme dhe motivuese nga {author}.
        Përktheje në SHQIP në mënyrë elegante dhe filozofike.
        
        Përgjigju VETËM në format JSON:
        {{
            "quote": "Teksti i shprehjes në shqip...",
            "author": "{author}",
            "context": "Një shpjegim shumë i shkurtër (1 fjali) se çfarë do të thotë kjo shprehje."
        }}
        """

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )

        content = json.loads(completion.choices[0].message.content)
        return jsonify({'success': True, 'data': content})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-transcript', methods=['POST'])
def get_transcript():
    data = request.json
    url = data.get('url')
    if not url: return jsonify({'error': 'Mungon linku'}), 400

    video_id = extract_video_id(url)
    if not video_id: return jsonify({'error': 'Linku jo i sakte'}), 400

    try:
        full_text = get_transcript_from_rapidapi(video_id)
        text_to_process = full_text[:20000] 

        prompt = f"""
        Ti je një redaktor profesionist. Krijo një ARTIKULL TË DETAJUAR në SHQIP nga ky transkript.
        
        Udhëzime:
        1. Shpjego termat shkencorë/teknikë.
        2. Jep udhëzime hap-pas-hapi (me numra) për ushtrime/teknika.
        3. Përdor kapituj të qartë.
        4. Tonalitet edukativ.

        Teksti:
        {text_to_process}

        Përgjigju VETËM me JSON:
        {{
            "title": "Titulli në Shqip",
            "sections": [
                {{ "headline": "Titulli Kapitullit", "content": "Përmbajtja..." }}
            ]
        }}
        """

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert content creator. Output detailed JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )

        ai_response = completion.choices[0].message.content
        structured_data = json.loads(ai_response)
        return jsonify({'success': True, 'data': structured_data})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

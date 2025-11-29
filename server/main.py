import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from urllib.parse import urlparse, parse_qs

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

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
def home(): return "Serveri punon (Versioni i Detajuar)!"

@app.route('/api/get-transcript', methods=['POST'])
def get_transcript():
    data = request.json
    url = data.get('url')
    if not url: return jsonify({'error': 'Mungon linku'}), 400

    video_id = extract_video_id(url)
    if not video_id: return jsonify({'error': 'Linku jo i sakte'}), 400

    try:
        full_text = get_transcript_from_rapidapi(video_id)
        # E rrisim pak limitin e karaktereve qe te mos humbim info
        text_to_process = full_text[:20000] 

        # PROMPT I RI DHE I DETAJUAR
        prompt = f"""
        Ti je një redaktor profesionist i shëndetit dhe mirëqenies. Detyra jote është të krijosh një ARTIKULL TË DETAJUAR DHE PRAKTIK në gjuhën SHQIPE, bazuar në transkriptin e videos.

        KUJDES: Mos bëj thjesht një përmbledhje të shkurtër! Lexuesi duhet të jetë në gjendje të praktikojë teknikat pa parë videon.

        Udhëzime të rrepta:
        1. Shkenca: Shpjego qartë termat si "Radikalet e Lira", "Jonet Negative", "Energjia Lunare" dhe si lidhen me shëndetin.
        2. Teknika Hap-pas-Hapi: Kur videoja shpjegon ushtrime (psh. frymëmarrja), duhet të përfshish çdo detaj: sa sekonda të thithësh, sa të nxjerrësh, sa herë ta përsërisësh. Numrat janë kritikë!
        3. Terminologjia: Përdor emrat origjinalë (si "Chandra Bhedi Pranayam") dhe shpjego kuptimin e tyre.
        4. Struktura: Krijo shumë kapituj (të paktën 5-6) për ta bërë leximin të lehtë.
        5. Tonaliteti: Edukativ, inkurajues dhe i saktë.

        Teksti origjinal:
        {text_to_process}

        Përgjigju VETËM me këtë format JSON:
        {{
            "title": "Titulli tërheqës dhe përshkrues në Shqip",
            "sections": [
                {{ "headline": "Titulli i Kapitullit (psh. Shkenca e Frymëmarrjes)", "content": "Teksti i gjatë dhe shpjegues..." }},
                {{ "headline": "Udhëzues Praktik: Teknika e Parë", "content": "1. Ulu këmbëkryq... 2. Mbyll vrimën e djathtë... (të gjitha hapat)" }}
            ]
        }}
        """

        completion = client.chat.completions.create(
            model="gpt-4o-mini", # Ose gpt-4 nëse ke akses, por mini është më shpejt
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
        print(f"Error: {str(e)}")
        return jsonify({'error': f'Gabim: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

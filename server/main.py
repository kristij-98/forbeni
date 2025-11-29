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
    # Përdorim RapidAPI
    api_key = os.environ.get("RAPIDAPI_KEY")
    api_host = os.environ.get("RAPIDAPI_HOST", "youtube-transcripts.p.rapidapi.com")
    
    if not api_key:
        raise Exception("Mungon RAPIDAPI_KEY në server.")

    url = f"https://{api_host}/youtube/transcript"
    
    # Kjo API specifike punon me param 'url'
    querystring = {"url": f"https://www.youtube.com/watch?v={video_id}"}

    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": api_host
    }

    response = requests.get(url, headers=headers, params=querystring)
    
    if response.status_code != 200:
        raise Exception(f"RapidAPI Error: {response.text}")
        
    data = response.json()
    
    # Logjika për të nxjerrë tekstin (varet nga struktura e JSON)
    # Shumica kthejnë { content: [{text: "..."}] } ose direkt listë
    full_text = ""
    
    if "content" in data:
        full_text = " ".join([item['text'] for item in data['content']])
    elif isinstance(data, list):
         full_text = " ".join([item['text'] for item in data])
    else:
        # Fallback nëse struktura është ndryshe
        full_text = str(data)
        
    return full_text

@app.route('/', methods=['GET'])
def home(): return "Serveri punon (RapidAPI Version)!"

@app.route('/api/get-transcript', methods=['POST'])
def get_transcript():
    data = request.json
    url = data.get('url')
    if not url: return jsonify({'error': 'Mungon linku'}), 400

    video_id = extract_video_id(url)
    if not video_id: return jsonify({'error': 'Linku jo i sakte'}), 400

    try:
        # HAPI 1: Marrja e Transkriptit nga RapidAPI
        full_text = get_transcript_from_rapidapi(video_id)
        
        # Kufizojmë tekstin për AI
        text_to_process = full_text[:15000] 

        # HAPI 2: AI Processing
        prompt = f"""
        Ti je një asistent inteligjent. Detyra jote është:
        1. Përktheje dhe përmblidhe tekstin në gjuhën SHQIPE.
        2. Strukturoje në format JSON me fusha 'title' dhe 'sections' (headline, content).

        Teksti origjinal:
        {text_to_process}

        Përgjigju VETËM me JSON valid:
        {{
            "title": "Titulli...",
            "sections": [
                {{ "headline": "...", "content": "..." }}
            ]
        }}
        """

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs only JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )

        ai_response = completion.choices[0].message.content
        structured_data = json.loads(ai_response)

        return jsonify({'success': True, 'data': structured_data})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': f'Ndodhi një gabim: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from openai import OpenAI
from urllib.parse import urlparse, parse_qs

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Konfigurimi i OpenAI (Inteligjencës)
# Këtë çelës do e marrim nga Railway Environment Variables
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

@app.route('/', methods=['GET'])
def home(): return "Serveri punon! Duhet API KEY per te vazhduar."

@app.route('/api/get-transcript', methods=['POST'])
def get_transcript():
    data = request.json
    url = data.get('url')
    if not url: return jsonify({'error': 'Mungon linku'}), 400

    video_id = extract_video_id(url)
    if not video_id: return jsonify({'error': 'Linku jo i sakte'}), 400

    try:
        # HAPI 1: Marrja e Transkriptit (Falas)
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try: transcript = transcript_list.find_transcript(['sq', 'en'])
        except: 
            transcript = transcript_list.find_manually_created_transcript()
            if not transcript: transcript = next(iter(transcript_list))
        
        full_text = " ".join([t['text'] for t in transcript.fetch()])
        
        # Kufizojmë tekstin nëse është gjigant (për të kursyer para me AI)
        # 15.000 karaktere janë rreth 20-30 minuta video
        text_to_process = full_text[:15000] 

        # HAPI 2: Dërgimi te AI për Përkthim dhe Strukturim
        print("Duke derguar te OpenAI...")
        
        prompt = f"""
        Ti je një asistent inteligjent. Detyra jote është:
        1. Lexo tekstin e mëposhtëm (që është transkript i një videoje).
        2. Përktheje dhe përmblidhe në gjuhën SHQIPE.
        3. Strukturoje në format JSON me fusha 'title' (titulli) dhe 'sections' (lista e kapitujve me 'headline' dhe 'content').
        4. Teksti duhet të jetë i rrjedhshëm, profesional dhe i ndarë me tituj (headlines) të qartë.

        Teksti origjinal:
        {text_to_process}

        Përgjigju VETËM me JSON valid në këtë format:
        {{
            "title": "Titulli i Videos në Shqip",
            "sections": [
                {{ "headline": "Hyrje", "content": "Përmbajtja..." }},
                {{ "headline": "Pika Kryesore", "content": "Përmbajtja..." }}
            ]
        }}
        """

        completion = client.chat.completions.create(
            model="gpt-4o-mini", # Modeli më i shpejtë dhe ekonomik
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs only JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )

        # Marrim përgjigjen nga AI
        ai_response = completion.choices[0].message.content
        structured_data = json.loads(ai_response)

        return jsonify({'success': True, 'data': structured_data})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': f'Ndodhi një gabim: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

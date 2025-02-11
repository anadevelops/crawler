from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import spacy
from spacy.training import Example
import json
import subprocess

app = Flask(__name__)
CORS(app)

nlp = spacy.load("pt_core_news_lg")

if "ner" not in nlp.pipe_names:
    nlp.add_pipe("ner", last=True)

ner = nlp.get_pipe("ner")
ner.add_label("ORG")
ner.add_label("PER")

TRAIN_DATA = [
    ("Prefeitura de Florianópolis anunciou novas medidas.", {"entities":[(0, 27, "ORG")]}),
    ("O governador de Santa Catarina visitou a cidade.", {"entities": [(2, 12, "PER")]}),
    ("Maria Silva é a nova secretária.", {"entities":[(0, 11, "PER")]}),
]

def train_model(nlp, train_data, epochs=10):
    optimizer = nlp.resume_training()
    with nlp.select_pipes(disable=["parser"]):
        for epoch in range(epochs):
            print(f"Epoch {epoch + 1}")
            losses = {}
            for text, annotations in train_data:
                doc = nlp.make_doc(text)
                # for token in doc:
                #     print(f"Token: '{token.text}' | Start: {token.idx} | End: {token.idx + len(token)}")
                example = Example.from_dict(doc, annotations)
                nlp.update([example], sgd=optimizer, losses=losses)
            print("Losses:", losses)

train_model(nlp, TRAIN_DATA)
nlp.to_disk("trained_model")

results = []

@app.route('/')
def serve_frontend():
    return send_from_directory('frontend/build', 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('frontend/build/static', path)

@app.route("/extract_entities", methods=["POST"])
def extract_entities():
    data = request.get_json()
    text = data.get("text", "")
    doc = nlp(text)

    people = [ent.text for ent in doc.ents if ent.label_ == "PER"]
    organizations = [ent.text for ent in doc.ents if ent.label_ == "ORG"]

    return jsonify({"people": people, "organizations": organizations})

@app.route('/add_results', methods=['POST'])
def add_results():
    global results
    data = request.get_json()
    results.extend(data)
    return jsonify({'message': 'Resultados adicionados com sucesso!'}), 200

@app.route('/results', methods = ['GET'])
def get_results():
    try:
        with open('corruption_articles.json', 'r', encoding='utf-8') as file:
            results = json.load(file)
            return jsonify(results)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return jsonify({'error': f'Erro ao ler o arquivo: {e}'})
    
@app.route('/run_crawler', methods=['POST'])
def run_crawler():
    try:
        subprocess.Popen(['node', './novo_crawler_teste.js'])
        return jsonify({'message': 'Crawler iniciado com sucesso!'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
logs = []
    
@app.route('/log', methods=['POST'])
def log_message():
    data = request.get_json()
    message = data.get('message', '')
    logs.append(message)
    print(message)
    return jsonify({'status': 'success'}), 200

@app.route('/logs', methods=['GET'])
def get_logs():
    return jsonify({'logs': logs}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

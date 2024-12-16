from flask import Flask, request, jsonify
import spacy
from spacy.training import Example
from spacy.pipeline import EntityRecognizer

app = Flask(__name__)

nlp = spacy.load("pt_core_news_lg")

if "ner" not in nlp.pipe_names:
    ner = EntityRecognizer(nlp.vocab)
    nlp.add_pipe("ner", last=True)
else:
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

@app.route("/extract_entities", methods=["POST"])
def extract_entities():
    data = request.get_json()
    text = data.get("text", "")
    doc = nlp(text)

    people = [ent.text for ent in doc.ents if ent.label_ == "PER"]
    organizations = [ent.text for ent in doc.ents if ent.label_ == "ORG"]

    return jsonify({"people": people, "organizations": organizations})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

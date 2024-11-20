from flask import Flask, request, jsonify
import spacy

nlp = spacy.load("pt_core_news_lg")

app = Flask(__name__)

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

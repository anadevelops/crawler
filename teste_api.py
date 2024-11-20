# import requests

# url = "http://localhost:5000/extract_entities"
# data = {
#     "text": "O João e a Maria foram à empresa XYZ e gastaram R$ 100,00."
# }

# response = requests.post(url, json=data)

# if response.status_code == 200:
#     print("Response JSON:")
#     print(response.json())
# else:
#     print(f"Failed to get a response: {response.status_code}")

# import spacy

# nlp = spacy.load('pt_core_news_lg')

# text = 'O João e a Maria foram á empresa XYZ e gastaram R$ 100,00.'
# doc = nlp(text)

# print(doc.ents)

# for ent in doc.ents:
#     print(ent.text, ent.label_)


import sys,os

sys.path.insert(0,os.path.abspath(os.curdir))
print(sys.path)

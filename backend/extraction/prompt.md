## GPT Prompt Output Format for Recipe Extraction

```json
{
  "title": <Titel des Rezepts>,
  "description": <Beschreibung des Rezepts>,
  "ingredients": [
        {
                "name": <Name des Zutat>,
                "amount": <Menge der Zutat>,
                "unit": <Einheit der Zutat in g, kg, ml, l, pcs>
        }
        ... weitere Zutaten
  ],
  "steps": [
        "Schritt 1",
        ... weitere Schritte
  ]
}

```

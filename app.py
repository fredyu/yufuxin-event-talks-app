import os
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_entry_content(entry_html):
    soup = BeautifulSoup(entry_html, 'html.parser')
    items = []
    
    h3_tags = soup.find_all('h3')
    if not h3_tags:
        # If there are no h3 headers, treat the entire body as a single general update
        text_content = soup.get_text().strip()
        return [{
            "type": "Update",
            "content": str(soup).strip(),
            "text_content": text_content
        }]
        
    current_type = None
    current_content = []
    
    for child in soup.contents:
        # Get tag name or None if it is a NavigableString
        name = getattr(child, 'name', None)
        if name == 'h3':
            if current_type:
                # Flush the collected content for the previous item
                item_content = ''.join(str(c) for c in current_content).strip()
                item_soup = BeautifulSoup(item_content, 'html.parser')
                items.append({
                    "type": current_type,
                    "content": item_content,
                    "text_content": item_soup.get_text().strip()
                })
            current_type = child.get_text().strip()
            current_content = []
        else:
            current_content.append(child)
            
    if current_type:
        # Flush the last item
        item_content = ''.join(str(c) for c in current_content).strip()
        item_soup = BeautifulSoup(item_content, 'html.parser')
        items.append({
            "type": current_type,
            "content": item_content,
            "text_content": item_soup.get_text().strip()
        })
        
    return items

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def get_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=15)
        if response.status_code != 200:
            return jsonify({"error": f"Failed to fetch feed (status {response.status_code})"}), 500
            
        feed_data = feedparser.parse(response.content)
        
        parsed_entries = []
        for entry in feed_data.entries:
            items = parse_entry_content(entry.summary)
            parsed_entries.append({
                "id": entry.get("id", ""),
                "title": entry.get("title", ""),
                "updated": entry.get("updated", ""),
                "link": entry.get("link", ""),
                "items": items
            })
            
        return jsonify({
            "title": feed_data.feed.get("title", "BigQuery Release Notes"),
            "link": feed_data.feed.get("link", "https://cloud.google.com/bigquery/docs/release-notes"),
            "entries": parsed_entries
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Standard Flask listener on port 5005
    app.run(host="0.0.0.0", port=5005, debug=True)

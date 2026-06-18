import urllib.request
import re
import json
import os

def scrape_nanaimo():
    url = "https://www.nanaimoarchives.ca/online-resources/mine-deaths-and-accidents?Year=0&Month=0&Day_And_Month=0&Name=&Occupation=0&Mine=0&search=Search+the+Database%21"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    print("Fetching data from Nanaimo Archives...")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    print("Parsing HTML...")
    
    # We will use regex to find all <div class="mining-death-result"> blocks
    pattern = r'<div class="mining-death-result">\s*<strong>(.*?)</strong>.*?<b>Occupation</b>\s*:\s*(.*?)</span>.*?<b>Hazard</b>\s*:\s*(.*?)</span>.*?<b>Mine</b>\s*:\s*(.*?)</span>.*?<b>Date</b>\s*:\s*(.*?)</span>'
    
    matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)
    
    results = []
    for match in matches:
        name = match[0].strip()
        occupation = match[1].strip()
        hazard = match[2].strip()
        mine = match[3].strip()
        date = match[4].strip()
        
        results.append({
            "name": name,
            "occupation": occupation,
            "hazard": hazard,
            "mineName": mine,
            "date": date,
            "city": "Nanaimo",   # Default to Nanaimo area
            "state": "BC"        # British Columbia
        })
        
    print(f"Extracted {len(results)} records.")
    
    output_path = os.path.join('public', 'nanaimo_data.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    print(f"Saved data to {output_path}")

if __name__ == "__main__":
    scrape_nanaimo()

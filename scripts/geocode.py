import openpyxl
import json
import time
import urllib.request
import urllib.parse
import os

def geocode(city, state):
    query = f"{city}, {state}, USA"
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
    headers = {'User-Agent': 'MiningFatalitiesProject/1.0'}
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"Error geocoding {query}: {e}")
    return None, None

def main():
    wb = openpyxl.load_workbook('Mining disasters.xlsx')
    sheet = wb.active
    
    locations = set()
    for row in sheet.iter_rows(min_row=2):
        city = row[2].value
        state = row[3].value
        if city and state:
            locations.add((city, state))
    
    print(f"Found {len(locations)} unique locations. Starting geocoding...")
    
    results = []
    # Ensure public directory exists
    if not os.path.exists('public'):
        os.makedirs('public')
        
    for i, (city, state) in enumerate(locations):
        print(f"[{i+1}/{len(locations)}] Geocoding {city}, {state}...")
        lat, lng = geocode(city, state)
        if lat and lng:
            results.append({
                "city": city,
                "state": state,
                "lat": lat,
                "lng": lng
            })
        else:
            print(f"  Failed to geocode {city}, {state}")
        
        # Nominatim usage policy requires 1 second between requests
        time.sleep(1.1)
        
        # Save progress every 10 locations
        if (i + 1) % 10 == 0:
            with open('public/geocoded_locations.json', 'w') as f:
                json.dump(results, f, indent=2)
                
    with open('public/geocoded_locations.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Done! Geocoded {len(results)} locations.")

if __name__ == "__main__":
    main()

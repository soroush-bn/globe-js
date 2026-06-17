# Mining Fatalities Globe

This project visualizes mining fatalities on a 3D globe using [Globe.gl](https://globe.gl/) and Next.js.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Geocode Locations**:
   The dataset contains city and state names, but the globe requires latitude and longitude. A script is provided to pre-geocode these locations using OpenStreetMap's Nominatim API.
   ```bash
   python scripts/geocode.py
   ```
   *Note: This script respects Nominatim's usage policy by waiting 1 second between requests. With ~500 unique locations, it will take about 10-15 minutes.*

3. **Run the Application**:
   ```bash
   npm run dev
   ```

## Project Structure

- `app/page.tsx`: The main globe visualization.
- `app/api/data/route.ts`: API endpoint that merges the Excel data with geocoded coordinates.
- `lib/data-utils.ts`: Utilities for reading the `.xlsx` file.
- `scripts/geocode.py`: Python script to generate `public/geocoded_locations.json`.
- `Mining disasters.xlsx`: The source dataset.

## Features

- **1 Dot per Fatality**: For every person killed in a disaster, a red dot is placed at the location (with a small random jitter to prevent perfect overlapping).
- **Interactive Globe**: Rotate, zoom, and hover over dots to see details about the mine and disaster.
- **Server-side Processing**: Next.js API handles the Excel parsing and data merging.

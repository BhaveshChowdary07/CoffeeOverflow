import requests
import os

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def find_nearest_hospital(lat, lng):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": 5000,
        "type": "hospital",
        "key": API_KEY
    }

    r = requests.get(url, params=params).json()

    if not r.get("results"):
        return None

    h = r["results"][0]

    return {
        "name": h["name"],
        "address": h.get("vicinity", "Unknown"),
        "lat": h["geometry"]["location"]["lat"],
        "lng": h["geometry"]["location"]["lng"],
        # demo phone (DO NOT use real hospital numbers)
        "real_phone": "+914012345678"
    }

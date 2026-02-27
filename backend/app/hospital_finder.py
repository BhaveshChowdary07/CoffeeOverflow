import requests
import os
import math
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def find_nearest_hospitals(lat, lng, radius_km=30):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    # We will try with "multispeciality" first. If list is too short, we search broadly.
    params = {
        "location": f"{lat},{lng}",
        "radius": 20000, # 20km search radius for API
        "type": "hospital",
        "keyword": "multispeciality hospital",
        "key": API_KEY
    }

    try:
        r = requests.get(url, params=params).json()
        results = r.get("results", [])
        
        # If very few results, try a broader search without "multispeciality" keyword
        if len(results) < 3:
            params.pop("keyword")
            params["radius"] = 15000 # 15km
            r_broad = requests.get(url, params=params).json()
            results.extend(r_broad.get("results", []))
            
    except Exception as e:
        print(f"Error fetching from Google Maps: {e}")
        return []

    processed_hospitals = []
    seen_ids = set()
    
    for h in results:
        place_id = h.get("place_id")
        if place_id in seen_ids: continue
        seen_ids.add(place_id)

        h_lat = h["geometry"]["location"]["lat"]
        h_lng = h["geometry"]["location"]["lng"]
        dist = haversine(lat, lng, h_lat, h_lng)
        
        # 1. Distance check (User requested 15-20km context, strictly filtering by 30km)
        if dist > radius_km:
            continue
            
        # 2. Relaxed Rating filters to ensure good local hospitals show up
        rating = h.get("rating", 0)
        user_ratings_total = h.get("user_ratings_total", 0)
        
        # Include hospitals if they have at least 3.5 rating or are very close (< 5km)
        if rating < 3.5 and dist > 5:
            continue
            
        # If they have fewer than 20 reviews, exclude unless they are the only options
        if user_ratings_total < 20 and len(results) > 10:
            continue

        processed_hospitals.append({
            "name": h["name"],
            "address": h.get("vicinity", "Unknown"),
            "lat": h_lat,
            "lng": h_lng,
            "rating": rating,
            "user_ratings_total": user_ratings_total,
            "distance_km": round(dist, 2),
            "phone": "+914012345678" 
        })

    # Sort by distance
    processed_hospitals.sort(key=lambda x: x["distance_km"])
    
    # Return top 15 results
    return processed_hospitals[:15]

def find_nearest_hospital(lat, lng):
    hospitals = find_nearest_hospitals(lat, lng, radius_km=30)
    return hospitals[0] if hospitals else None

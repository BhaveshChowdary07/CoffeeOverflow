import requests
import os
import math
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def haversine(lat1, lon1, lat2, lon2):
    """Great circle distance in km between two lat/lng points."""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    return 2 * math.asin(math.sqrt(a)) * 6371  # km


def _places_search(lat, lng, radius_m, keyword=None):
    """Single call to Google Places nearbysearch."""
    params = {
        "location": f"{lat},{lng}",
        "radius": min(radius_m, 50000),  # API max is 50,000 m
        "type": "hospital",
        "key": API_KEY,
    }
    if keyword:
        params["keyword"] = keyword

    try:
        resp = requests.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            params=params,
            timeout=10,
        )
        data = resp.json()
        status = data.get("status")
        if status not in ("OK", "ZERO_RESULTS"):
            print(f"[hospital_finder] Google API status: {status} | {data.get('error_message','')}")
        return data.get("results", [])
    except Exception as e:
        print(f"[hospital_finder] Request error: {e}")
        return []


def find_nearest_hospitals(lat, lng, radius_km=30):
    """
    Returns hospitals within `radius_km` km (Haversine distance).
    Searches Google Places with multiple passes to maximise recall.
    """
    radius_m = int(radius_km * 1000)

    # Pass 1 – multispeciality keyword
    results = _places_search(lat, lng, radius_m, keyword="multispeciality")

    # Pass 2 – general hospital search (no keyword) to catch hospitals
    #           that don't self-label as multispeciality
    general = _places_search(lat, lng, radius_m)
    
    # Merge, de-duplicate by place_id
    seen = {h["place_id"] for h in results}
    for h in general:
        if h["place_id"] not in seen:
            results.append(h)
            seen.add(h["place_id"])

    print(f"[hospital_finder] Total candidates from Google: {len(results)}")

    processed = []
    for h in results:
        h_lat = h["geometry"]["location"]["lat"]
        h_lng = h["geometry"]["location"]["lng"]
        dist = haversine(lat, lng, h_lat, h_lng)

        # --- Distance filter (the ONLY hard filter the user asked for) ---
        if dist > radius_km:
            continue

        rating            = h.get("rating", 0)
        total_ratings     = h.get("user_ratings_total", 0)

        # Soft quality filter – drop only very poorly rated & very obscure places
        # (rating must be ≥ 3.0 OR fewer than 10 reviews means we still show it)
        if rating > 0 and rating < 3.0 and total_ratings > 50:
            continue

        processed.append({
            "name":              h["name"],
            "address":           h.get("vicinity", "Unknown"),
            "lat":               h_lat,
            "lng":               h_lng,
            "rating":            rating,
            "user_ratings_total": total_ratings,
            "distance_km":       round(dist, 2),
            "phone":             "+914012345678",
        })

    processed.sort(key=lambda x: x["distance_km"])
    print(f"[hospital_finder] Hospitals after distance/quality filter: {len(processed)}")
    return processed[:20]


def find_nearest_hospital(lat, lng):
    hospitals = find_nearest_hospitals(lat, lng, radius_km=30)
    return hospitals[0] if hospitals else None

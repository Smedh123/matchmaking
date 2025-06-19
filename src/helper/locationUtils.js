// import axios from 'axios';


const apiKey = "AIzaSyCUPJQe9bZZ9aMowE_5gl9Qe19u5CE7egI";

export async function getCoordinatesFromPlaceName(micromarket) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(micromarket)}&key=${apiKey}`
  );
  const data = await response.json();
  if (data.results && data.results[0]) {
    const { lat, lng } = data.results[0].geometry.location;
    // console.log(lat,lng);
    return { lat, lng };
  }
  return { lat: 0, lng: 0 };
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export async function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

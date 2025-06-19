import { getCoordinatesFromPlaceName, getDistanceFromLatLonInKm } from './locationUtils';
const MAX_DISTANCE_KM = 10;

// Constants
const WEIGHTS = {
  price: 20,
  size: 20,
  config: 20,
  assetType: 20,
  location: 20, // Add later
};

function getConfigScore(reqConfig, propConfig) {
  const reqNum = parseInt(reqConfig);   // e.g. "2 BHK" → 2
  const propNum = parseInt(propConfig); // e.g. "3 BHK" → 3

  if (isNaN(reqNum) || isNaN(propNum)) return 0;

  if (reqNum === propNum) return WEIGHTS.config;
  if (propNum === reqNum + 1) return WEIGHTS.config / 2;

  return 0;
}

function getSizeScore(reqSize, propSize) {
  const maxScore = WEIGHTS.size;         // 20
  const tolerance = reqSize * 0.1;       // ±10%
  const diff = Math.abs(propSize - reqSize);

  if (diff > tolerance) return 0;

  // Linear scaling: closer = higher score
  const score = maxScore * (1 - diff / tolerance);
    console.log("area score", score, "reqSize", reqSize, "propSize", propSize, "tolerance", tolerance, "diff", diff);
  return score; 
}

function getPriceScore(reqMin, reqMax, propPrice) {
  const maxScore = WEIGHTS.price; // 20

  if (propPrice >= reqMin && propPrice <= reqMax) {
    return maxScore; // perfect match
  }

  if (propPrice < reqMin) return 0; 

  const tolerance = reqMax * 0.1; 
  const overBy = propPrice - reqMax;

  if (overBy > tolerance) return 0;

  
  const normalized = 1 - overBy / tolerance;
  const decayPower = 2;
  const score = maxScore * Math.pow(normalized, decayPower);

  return Math.round(score);
}

function getAssetTypeScore(reqType, propType) {
  return reqType.toLowerCase() === propType.toLowerCase()
    ? WEIGHTS.assetType
    : 0;
}

export async function getLocationScore(reqLocationName, propLat, propLng) {
  try {
    const { lat: reqLat, lng: reqLng } = await getCoordinatesFromPlaceName(reqLocationName);
    if (!reqLat || !reqLng) return 0;

    const distance = await getDistanceFromLatLonInKm(reqLat, reqLng, propLat, propLng);

    if (distance >= MAX_DISTANCE_KM) return 0;

    const ratio = 1 - (distance / MAX_DISTANCE_KM);
    return Math.round(WEIGHTS.location * ratio);
  } catch (err) {
    console.error('Location scoring failed:', err);
    return 0;
  }
}

export function getMatchScore(requirement, property) {
  let actualScore = 0;
  let possibleScore = 0;

  if (requirement.priceMin && requirement.priceMax && property.price) {
    possibleScore += WEIGHTS.price;
    actualScore += getPriceScore(requirement.priceMin, requirement.priceMax, property.price);
  }

  if (requirement.sba && property.sba) {
    possibleScore += WEIGHTS.size;
    actualScore += getSizeScore(requirement.sba, property.sba);
  }

  if (requirement.config && property.config) {
    possibleScore += WEIGHTS.config;
    actualScore += getConfigScore(requirement.config, property.config);
  }

  if (requirement.assetType && property.assetType) {
    possibleScore += WEIGHTS.assetType;
    actualScore += getAssetTypeScore(requirement.assetType, property.assetType);
  }

  if (requirement.locationName && property.latitude && property.longitude) {
    possibleScore += WEIGHTS.location;
    actualScore += getLocationScore(requirement.locationName, property.latitude, property.longitude);
  }

  if (possibleScore === 0) return 0;

  const normalized = (actualScore / possibleScore) * 100;
  return Math.round(normalized); // return percentage
}

/* usage for threshold 70
const score = getMatchScore(requirement, property);
if (score >= 70) {
  console.log('✅ Good match:', score);
} else {
  console.log('❌ Not good enough:', score);
}
*/





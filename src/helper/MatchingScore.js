import { getDistanceFromLatLonInKm } from "./locationUtils";
import { ratio } from "fuzzball";
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
  const reqNum = parseFloat(reqConfig); // e.g. "2 BHK" → 2
  const propNum = parseFloat(propConfig); // e.g. "3 BHK" → 3

  if (isNaN(reqNum) || isNaN(propNum)) return 0;

  if (reqNum === propNum) return WEIGHTS.config;
  if (propNum === reqNum + 1) return WEIGHTS.config / 2;

  return 0;
}

// function fuzzyIncludes(needle: string, haystack: string): boolean

function fuzzyIncludes(needle, haystack, threshold = 85) {
  const haystackWords = haystack.split(/\s+/);
  return haystackWords.some((word) => ratio(needle, word) >= threshold);
}

function getSizeScore(reqSize, propSize) {
  const maxScore = WEIGHTS.size; // 20
  const tolerance = reqSize * 0.1; // ±10%
  const diff = Math.abs(propSize - reqSize);

  if (diff > tolerance) return 0;

  // Linear scaling: closer = higher score
  const score = maxScore * (1 - diff / tolerance);
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

  return score;
}

function getAssetTypeScore(reqType, propType) {
  return reqType.toLowerCase() === propType.toLowerCase()
    ? WEIGHTS.assetType
    : 0;
}

export async function getLocationScore(reqLat, reqLng, propLat, propLng) {
  try {
    if (!reqLat || !reqLng) return 0;

    const distance = await getDistanceFromLatLonInKm(
      reqLat,
      reqLng,
      propLat,
      propLng
    );
    if (distance >= MAX_DISTANCE_KM) return 0;
    const ratio = 1 - distance / MAX_DISTANCE_KM;
    return WEIGHTS.location * ratio;
  } catch (err) {
    console.error("Location scoring failed:", err);
    return 0;
  }
}

export async function getMatchScore(requirement, property) {
  let actualScore = 0;
  let possibleScore = 0;
  const breakdown = {};

  // Price
  if (requirement.priceMin && requirement.priceMax) {
    if (property.price == null) return null; // Reject: required, but missing
    const score = getPriceScore(
      requirement.priceMin,
      requirement.priceMax,
      property.price
    );
    if (score === 0) return null;
    possibleScore += WEIGHTS.price;
    actualScore += score;
    breakdown.price = score;
  }

  // Size (SBA)
  if (requirement.sba) {
    if (property.sba == null) return null; // Reject: required, but missing
    const score = getSizeScore(requirement.sba, property.sba);
    if (score === 0) return null;
    possibleScore += WEIGHTS.size;
    actualScore += score;
    breakdown.size = score;
  }

  // Configuration
  if (requirement.config) {
    if (!property.config) return null;
    const score = getConfigScore(requirement.config, property.config);
    if (score === 0) return null;
    possibleScore += WEIGHTS.config;
    actualScore += score;
    breakdown.config = score;
  }

  console.log(requirement.latitude, requirement.longitude);

  // Asset Type
  if (requirement.assetType) {
    if (!property.assetType) return null;
    const score = getAssetTypeScore(requirement.assetType, property.assetType);
    if (score === 0) return null;
    possibleScore += WEIGHTS.assetType;
    actualScore += score;
    breakdown.assetType = score;
  }

  // Location
  if (requirement.locationName && property.propertyName) {
    const reqName = requirement.locationName.trim().toLowerCase();
    const propName = property.propertyName.trim().toLowerCase();
    let score = 0;

    const fuzzScore = ratio(reqName, propName);
    const isSubstringMatch = propName.includes(reqName);
    const isFuzzyContained = fuzzyIncludes(reqName, propName);

    const isNameMatch = fuzzScore >= 85 || isSubstringMatch || isFuzzyContained;

    if (isNameMatch) {

      possibleScore += WEIGHTS.location;
      actualScore += WEIGHTS.location;
      breakdown.location = WEIGHTS.location;
    } else if (requirement.latitude && requirement.longitude) {
      if (property.latitude == null || property.longitude == null) return null;

      score = await getLocationScore(
        requirement.latitude,
        requirement.longitude,
        property.latitude,
        property.longitude
      );

      if (score === 0) return null;

      possibleScore += WEIGHTS.location;
      actualScore += score;
      breakdown.location = score;
    }
    else{
      return null;
    }
  }

  if (possibleScore === 0) return null;

  const total = (actualScore / possibleScore) * 100;

  return {
    total,
    breakdown,
    actualScore,
    possibleScore,
  };
}

import * as Location from 'expo-location';

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const checkLocationStatus = async (targetLat: number, targetLon: number, radius: number) => {
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const distance = calculateDistance(coords.latitude, coords.longitude, targetLat, targetLon);
  return {
    isInside: distance <= radius,
    currentDistance: Math.round(distance)
  };
};
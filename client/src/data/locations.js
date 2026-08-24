/**
 * Indian States & Districts with approximate lat/lng coordinates.
 * Used to auto-fill map coordinates when a citizen selects their location.
 */
export const locationData = {
  'Andhra Pradesh': [
    { district: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { district: 'Vijayawada', lat: 16.5074, lng: 80.6466 },
    { district: 'Tirupati', lat: 13.6288, lng: 79.4192 },
  ],
  'Assam': [
    { district: 'Guwahati', lat: 26.1445, lng: 91.7362 },
    { district: 'Dibrugarh', lat: 27.4753, lng: 94.9122 },
  ],
  'Bihar': [
    { district: 'Patna', lat: 25.6093, lng: 85.1376 },
    { district: 'Gaya', lat: 24.7961, lng: 84.9999 },
    { district: 'Muzaffarpur', lat: 26.1197, lng: 85.3911 },
    { district: 'Bhagalpur', lat: 25.2445, lng: 86.9729 },
  ],
  'Delhi': [
    { district: 'New Delhi', lat: 28.6139, lng: 77.2090 },
    { district: 'North Delhi', lat: 28.7041, lng: 77.2025 },
    { district: 'South Delhi', lat: 28.5285, lng: 77.2590 },
  ],
  'Gujarat': [
    { district: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { district: 'Surat', lat: 21.1702, lng: 72.8311 },
    { district: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    { district: 'Rajkot', lat: 22.3039, lng: 70.8022 },
  ],
  'Karnataka': [
    { district: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946 },
    { district: 'Mysuru', lat: 12.2958, lng: 76.6394 },
    { district: 'Hubli-Dharwad', lat: 15.3647, lng: 75.1240 },
  ],
  'Kerala': [
    { district: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
    { district: 'Kochi', lat: 9.9312, lng: 76.2673 },
    { district: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
  ],
  'Madhya Pradesh': [
    { district: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { district: 'Indore', lat: 22.7196, lng: 75.8577 },
    { district: 'Jabalpur', lat: 23.1815, lng: 79.9864 },
  ],
  'Maharashtra': [
    { district: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { district: 'Pune', lat: 18.5204, lng: 73.8567 },
    { district: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { district: 'Nashik', lat: 19.9975, lng: 73.7898 },
  ],
  'Odisha': [
    { district: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
    { district: 'Cuttack', lat: 20.4619, lng: 85.8827 },
  ],
  'Punjab': [
    { district: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
    { district: 'Amritsar', lat: 31.6340, lng: 74.8723 },
  ],
  'Rajasthan': [
    { district: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { district: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
    { district: 'Udaipur', lat: 24.5854, lng: 73.7125 },
    { district: 'Kota', lat: 25.1800, lng: 75.8640 },
  ],
  'Tamil Nadu': [
    { district: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { district: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
    { district: 'Madurai', lat: 9.9252, lng: 78.1198 },
    { district: 'Salem', lat: 11.6643, lng: 78.1460 },
  ],
  'Telangana': [
    { district: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { district: 'Warangal', lat: 17.9784, lng: 79.5941 },
  ],
  'Uttar Pradesh': [
    { district: 'Varanasi', lat: 25.3176, lng: 82.9739 },
    { district: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { district: 'Agra', lat: 27.1767, lng: 78.0081 },
    { district: 'Prayagraj', lat: 25.4316, lng: 81.8463 },
    { district: 'Meerut', lat: 28.9845, lng: 77.7064 },
  ],
  'West Bengal': [
    { district: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { district: 'Howrah', lat: 22.5756, lng: 88.2636 },
    { district: 'Durgapur', lat: 23.5204, lng: 87.3119 },
  ],
};

export const states = Object.keys(locationData).sort();

export function getDistricts(state) {
  return locationData[state]?.map(d => d.district) || [];
}

export function getCoordinates(state, district) {
  const entry = locationData[state]?.find(d => d.district === district);
  return entry ? { lat: entry.lat, lng: entry.lng } : null;
}

// India center for the Leaflet map
export const INDIA_CENTER = [22.5, 78.5];
export const INDIA_ZOOM = 5;

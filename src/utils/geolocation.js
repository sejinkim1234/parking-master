// Haversine formula to calculate distance between two coordinates in meters
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  var R = 6371e3; // Radius of the earth in m
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in m
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true }
    );
  });
};

export const checkGeofence = async (homeLocation) => {
  if (!homeLocation) return false;
  try {
    const currentPos = await getCurrentPosition();
    const distance = getDistanceFromLatLonInM(
      homeLocation.lat, homeLocation.lng,
      currentPos.lat, currentPos.lng
    );
    // Return true if within 200 meters
    return distance <= 200;
  } catch (error) {
    console.error("Geofence error:", error);
    return false; // Default to external mode on error
  }
};

export const getPOIfromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'ko-KR,ko;q=0.9' // Request Korean if available
      }
    });
    if (!response.ok) return '';
    const data = await response.json();
    if (data && data.address) {
      const name = data.address.building || data.address.retail || data.address.amenity || data.address.tourism || data.address.leisure || data.address.commercial;
      if (name) return name;
      
      const road = data.address.road || data.address.pedestrian;
      if (road) return `${road} ${data.address.house_number || ''}`.trim();
      
      if (data.address.neighbourhood) return data.address.neighbourhood;
      if (data.address.suburb) return data.address.suburb;
    }
    return '';
    return '';
  } catch (err) {
    console.error("POI fetching error:", err);
    return '';
  }
};

export const getCoordinatesFromAddress = async (address) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
      headers: {
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Address geocoding error:", error);
    throw error;
  }
};

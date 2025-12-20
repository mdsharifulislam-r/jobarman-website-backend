import config from "../config";

export const getFromGoogleMaps = async (address: string) => {
try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${config.googleMaps.key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Maps error: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error("No results from Google Maps");
  }

  const result = data.results[0];

  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    place: result.formatted_address,
  };
} catch (error) {
  console.log(error);
  
}
};


const getCountryName = async (address: string) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${config.googleMaps.key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Maps error: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error("No results from Google Maps");
  }

  const result = data.results?.[0]
  console.log(result);
  
  return {
    country: result.address_components.find(
      (component: any) => component.types[0] === "country"
    )?.long_name,
    state: result.address_components.find(
      (component: any) => component.types[0] === "administrative_area_level_1"
    )?.long_name
  }

  } catch (error) {
    console.log(error);
    return
    
  }
}

const getCountryAndStateFromLatLong = async (latitude: number, longitude: number) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${config.googleMaps.key}`;

  const res = await fetch(url);
  if (!res.ok) {
    return ""
  } 

  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) {
    return ""
  }

  const result = data.results?.[0]
  console.log(result);
  
  return {
    country: result.address_components.find(
      (component: any) => component.types[0] === "country"
    )?.long_name,
    state: result.address_components.find(
      (component: any) => component.types[0] === "administrative_area_level_1"
    )?.long_name
  }
}

export const mapHelper = { getFromGoogleMaps, getCountryName , getCountryAndStateFromLatLong};
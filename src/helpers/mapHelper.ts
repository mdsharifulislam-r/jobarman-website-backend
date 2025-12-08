import config from "../config";

export const getFromOSM = async (address: string) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;

  try {
    const url = `https://us1.locationiq.com/v1/search.php?key=${config.locationQ.key}&q=${address}&format=json`;
    const res = await fetch(url);



    
    const data: any = await res.json();


    
    
    return {
      latitude: data[0]?.lat,
      longitude: data[0]?.lon,
      place: data[0]?.display_name,
    };
  } catch (err) {
    console.error('OSM fallback error:', err);
    console.error('OSM primary failed, falling back to LocationIQ...');
    // Example fallback provider
     const response = await fetch(url, {
      headers: {
        'User-Agent': 'VoyazenApp/1.0 (sharif@example.com)',
      },
    });



    const results: any = await response.json();
    
    if(results?.length < 1) throw new Error('No results from OSM');
    
    if (!results.length) return {};



    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
      place: results[0].display_name,
    };
  }
};
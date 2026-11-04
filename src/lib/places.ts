export type Place = { state: string; city: string; area: string; lat: number; lng: number };

export const PLACES: Place[] = [
  { state: "Lagos", city: "Lagos", area: "Ikeja", lat: 6.6018, lng: 3.3515 },
  { state: "Lagos", city: "Lagos", area: "Yaba", lat: 6.5158, lng: 3.3711 },
  { state: "Lagos", city: "Lagos", area: "Lekki", lat: 6.4474, lng: 3.4723 },
  { state: "Lagos", city: "Lagos", area: "Surulere", lat: 6.496, lng: 3.355 },
  { state: "FCT", city: "Abuja", area: "Wuse", lat: 9.0765, lng: 7.475 },
  { state: "FCT", city: "Abuja", area: "Garki", lat: 9.033, lng: 7.483 },
  { state: "FCT", city: "Abuja", area: "Gwarinpa", lat: 9.1108, lng: 7.413 },
  { state: "Edo", city: "Benin City", area: "GRA", lat: 6.318, lng: 5.622 },
  { state: "Edo", city: "Benin City", area: "Ugbowo", lat: 6.393, lng: 5.611 },
  { state: "Edo", city: "Benin City", area: "Ring Road", lat: 6.335, lng: 5.622 },
  { state: "Edo", city: "Auchi", area: "Auchi", lat: 7.067, lng: 6.267 },
  { state: "Rivers", city: "Port Harcourt", area: "GRA", lat: 4.815, lng: 7.0 },
  { state: "Rivers", city: "Port Harcourt", area: "Rumuola", lat: 4.843, lng: 7.004 },
  { state: "Oyo", city: "Ibadan", area: "Bodija", lat: 7.429, lng: 3.915 },
  { state: "Oyo", city: "Ibadan", area: "Dugbe", lat: 7.388, lng: 3.888 },
  { state: "Enugu", city: "Enugu", area: "Independence Layout", lat: 6.443, lng: 7.513 },
  { state: "Kano", city: "Kano", area: "Nasarawa", lat: 12.003, lng: 8.522 },
  { state: "Delta", city: "Asaba", area: "Asaba", lat: 6.198, lng: 6.732 },
];

export const STATES = Array.from(new Set(PLACES.map((place) => place.state)));

export function citiesIn(state: string) {
  return Array.from(new Set(PLACES.filter((place) => place.state === state).map((place) => place.city)));
}

export function areasIn(city: string) {
  return PLACES.filter((place) => place.city === city);
}

export function placeFor(city: string, area: string) {
  return PLACES.find((place) => place.city === city && place.area === area) ?? PLACES.find((place) => place.city === city);
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(r * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

export function nearestPlace(lat: number, lng: number) {
  return PLACES.reduce((best, place) => (distanceKm({ lat, lng }, place) < distanceKm({ lat, lng }, best) ? place : best));
}

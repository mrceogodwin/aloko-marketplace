import { PLACES } from "@/lib/places";

export type MapPin = {
  id: string;
  title: string;
  price: string;
  lat: number;
  lng: number;
  label: string;
};

function project(lat: number, lng: number) {
  const x = ((lng - 2.6) / (14.8 - 2.6)) * 300 + 24;
  const y = ((14 - lat) / (14 - 4.1)) * 360 + 18;
  return { x, y };
}

const CITIES = Array.from(new Map(PLACES.map((place) => [place.city, place])).values());

export function ListingMap({
  pins,
  you,
  onOpen,
}: {
  pins: MapPin[];
  you: { lat: number; lng: number } | null;
  onOpen: (id: string) => void;
}) {
  const placed = pins.map((pin, index) => {
    const point = project(pin.lat, pin.lng);
    return { ...pin, x: point.x + (index % 3) * 6, y: point.y + (index % 2) * 6 };
  });
  const me = you ? project(you.lat, you.lng) : null;

  return (
    <div className="area-map" role="img" aria-label="Listings by area. Pins are neighbourhoods, not houses.">
      <svg viewBox="0 0 348 400" className="area-svg">
        <rect x="8" y="8" width="332" height="384" rx="18" />
        {CITIES.map((city) => {
          const point = project(city.lat, city.lng);
          return (
            <g key={city.city}>
              <circle cx={point.x} cy={point.y} r="2" />
              <text x={point.x + 6} y={point.y - 4}>{city.city}</text>
            </g>
          );
        })}
        {me && <circle className="you" cx={me.x} cy={me.y} r="8" />}
        {placed.map((pin) => (
          <g key={pin.id} className="pin" onClick={() => onOpen(pin.id)} role="button">
            <circle cx={pin.x} cy={pin.y} r="7" />
            <text x={pin.x + 10} y={pin.y + 4}>{pin.label}</text>
          </g>
        ))}
      </svg>
      <p className="type-lead">Pins sit on an area, not a house. {me ? "The ring is your area." : "Use your area to see distance."}</p>
    </div>
  );
}

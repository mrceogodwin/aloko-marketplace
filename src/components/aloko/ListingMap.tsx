import { useState } from "react";

export type MapPin = {
  id: string;
  title: string;
  price: string;
  lat: number;
  lng: number;
  label: string;
};

export function ListingMap({
  pins,
  you,
  onOpen,
}: {
  pins: MapPin[];
  you: { lat: number; lng: number } | null;
  onOpen: (id: string) => void;
}) {
  const [active, setActive] = useState(pins[0]?.id ?? "");
  const pin = pins.find((item) => item.id === active) ?? pins[0];
  const center = pin ?? you ?? { lat: 9.082, lng: 8.6753 };
  const src = `https://www.google.com/maps?q=${center.lat},${center.lng}&z=${pin ? 13 : 6}&hl=en&output=embed`;

  return (
    <div className="gmap">
      <iframe title="Google map" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <div className="pin-row">
        {pins.map((item) => (
          <button key={item.id} className={item.id === pin?.id ? "seg-btn on" : "seg-btn"} type="button" onClick={() => setActive(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {pin && (
        <button className="seg-btn on" type="button" onClick={() => onOpen(pin.id)}>
          {pin.title} · {pin.price}
        </button>
      )}
    </div>
  );
}

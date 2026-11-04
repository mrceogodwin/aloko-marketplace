import { useState } from "react";
import { finishOnboarding } from "@/lib/aloko.functions";
import { areasIn, citiesIn, nearestPlace, STATES, type Place } from "@/lib/places";

const TYPES = [
  { id: "buyer", label: "I’m here to buy", line: "Discover products, negotiate and shop. Free." },
  { id: "individual", label: "I’m an individual seller", line: "Sell personal belongings and unwanted items." },
  { id: "business", label: "I’m a business", line: "Manage a storefront and inventory." },
  { id: "service", label: "I offer decluttering services", line: "Home and office organisation." },
] as const;

type Role = (typeof TYPES)[number]["id"];

export function Onboarding({ onDone, onError }: { onDone: (role: Role) => void; onError: (message: string) => void }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("buyer");
  const [state, setState] = useState("Lagos");
  const [city, setCity] = useState("Lagos");
  const [area, setArea] = useState("Ikeja");
  const [interests, setInterests] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [radiusKm, setRadiusKm] = useState(0);
  const [coverage, setCoverage] = useState("city");
  const [nearNote, setNearNote] = useState("");

  const cities = citiesIn(state);
  const areas = areasIn(city);

  const save = (skipCity = false) => {
    void finishOnboarding({
      data: {
        role,
        city: skipCity ? "" : city,
        state: skipCity ? "" : state,
        area: skipCity ? "" : area,
        interests,
        businessName,
        serviceArea: serviceArea || area,
        radiusKm,
        coverage,
      },
    })
      .then((result) => onDone(result.role))
      .catch((err: unknown) => onError(err instanceof Error ? err.message : "Could not finish setup."));
  };

  const useNear = () => {
    if (!navigator.geolocation) {
      setNearNote("This phone has no location. Choose a city instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const place: Place = nearestPlace(pos.coords.latitude, pos.coords.longitude);
        setState(place.state);
        setCity(place.city);
        setArea(place.area);
        setNearNote(`Using ${place.area}, ${place.city}. Your exact spot is not saved or shown to anyone.`);
      },
      () => setNearNote("Location was blocked. Choose a city instead."),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 },
    );
  };

  const location = (
    <div className="form">
      <p className="type-lead">Find deals near you. Your precise location is never shown to sellers or other people, and Aloko does not track you in the background.</p>
      <button className="primary" type="button" onClick={useNear}>Use my current location</button>
      <button className="ghost" type="button" onClick={() => setNearNote("Choose a state and area below.")}>Choose location manually instead</button>
      {nearNote ? <p className="type-lead">{nearNote}</p> : null}
      <label>
        State
        <select value={state} onChange={(event) => { const next = event.target.value; setState(next); const nextCity = citiesIn(next)[0]; setCity(nextCity); setArea(areasIn(nextCity)[0]?.area ?? ""); }}>
          {STATES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        City
        <select value={city} onChange={(event) => { const next = event.target.value; setCity(next); setArea(areasIn(next)[0]?.area ?? ""); }}>
          {cities.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        Area
        <select value={area} onChange={(event) => setArea(event.target.value)}>
          {areas.map((item) => <option key={item.area}>{item.area}</option>)}
        </select>
      </label>
      <p className="type-lead">Listings show an area such as Ugbowo, Benin City. Never a house number.</p>
    </div>
  );

  if (step === 0) {
    return (
      <div className="sheet">
        <h2>How would you like to use Aloko?</h2>
        <p className="type-lead">One login. You can add another way to use Aloko later. You can skip the optional questions and browse.</p>
        <div className="types">
          {TYPES.map((item) => (
            <button key={item.id} type="button" className={role === item.id ? "type on" : "type"} onClick={() => setRole(item.id)}>
              <strong>{item.label}</strong>
              <span>{item.line}</span>
            </button>
          ))}
          <button className="primary" type="button" onClick={() => setStep(1)}>Continue</button>
        </div>
      </div>
    );
  }

  if (role === "buyer" && step === 1) {
    return (
      <div className="sheet">
        <h2>Where are you?</h2>
        {location}
        <button className="primary" type="button" onClick={() => setStep(2)}>Continue</button>
        <button className="ghost" type="button" onClick={() => save(true)}>Skip and browse Nigeria</button>
      </div>
    );
  }

  if (role === "buyer" && step === 2) {
    return (
      <div className="sheet">
        <h2>What are you looking for?</h2>
        <form className="form" onSubmit={(event) => { event.preventDefault(); setStep(3); }}>
          <label>Interests, optional<input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Furniture, phones" /></label>
          <button className="primary" type="submit">Continue</button>
          <button className="ghost" type="button" onClick={() => setStep(3)}>Skip</button>
        </form>
      </div>
    );
  }

  if (role === "buyer" && step === 3) {
    return (
      <div className="sheet">
        <h2>How far should we look?</h2>
        <div className="form">
          <label>
            Distance
            <select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}>
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
              <option value={50}>Within 50 km</option>
              <option value={100}>Within 100 km</option>
              <option value={0}>Anywhere in Nigeria</option>
            </select>
          </label>
          <button className="primary" type="button" onClick={() => save(false)}>Enter Aloko</button>
          <button className="ghost" type="button" onClick={() => { setRadiusKm(0); save(false); }}>Skip</button>
        </div>
      </div>
    );
  }

  if (role === "individual" && step === 1) return <div className="sheet"><h2>Where will people collect from?</h2>{location}<button className="primary" type="button" onClick={() => setStep(2)}>Continue</button></div>;
  if (role === "individual" && step === 2) {
    return (
      <div className="sheet">
        <h2>Seller profile</h2>
        <p className="type-lead">Buyers will see {area}, {city}. Your house address stays private until you agree a pickup in chat. Three listings are free.</p>
        <label className="form">
          Delivery coverage
          <select value={coverage} onChange={(event) => setCoverage(event.target.value)}>
            <option value="neighbourhood">This area only</option>
            <option value="city">This city</option>
            <option value="state">This state</option>
            <option value="nationwide">Nationwide</option>
          </select>
        </label>
        <button className="primary" type="button" onClick={() => save(false)}>Enter Seller Studio</button>
      </div>
    );
  }

  if (role === "business" && step === 1) {
    return (
      <div className="sheet">
        <h2>Business name</h2>
        <form className="form" onSubmit={(event) => { event.preventDefault(); setStep(2); }}>
          <label>Registered or trading name<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required /></label>
          <p className="type-lead">CAC documents are for businesses only, and you can add them after you are inside.</p>
          <button className="primary" type="submit">Continue</button>
        </form>
      </div>
    );
  }
  if (role === "business" && step === 2) return <div className="sheet"><h2>Where is the shop?</h2>{location}<button className="primary" type="button" onClick={() => setStep(3)}>Continue</button></div>;
  if (role === "business" && step === 3) {
    return (
      <div className="sheet">
        <h2>Who can you reach?</h2>
        <label className="form">
          Coverage
          <select value={coverage} onChange={(event) => setCoverage(event.target.value)}>
            <option value="city">This city</option>
            <option value="state">This state</option>
            <option value="nationwide">Nationwide</option>
          </select>
        </label>
        <button className="primary" type="button" onClick={() => save(false)}>Enter Business Centre</button>
      </div>
    );
  }

  if (role === "service" && step === 1) {
    return (
      <div className="sheet">
        <h2>Service name</h2>
        <form className="form" onSubmit={(event) => { event.preventDefault(); setStep(2); }}>
          <label>What should clients call you?<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required /></label>
          <button className="primary" type="submit">Continue</button>
        </form>
      </div>
    );
  }
  if (role === "service" && step === 2) {
    return (
      <div className="sheet">
        <h2>What do you offer?</h2>
        <form className="form" onSubmit={(event) => { event.preventDefault(); setStep(3); }}>
          <label>Services<input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Home, office, storage" /></label>
          <button className="primary" type="submit">Continue</button>
        </form>
      </div>
    );
  }
  if (role === "service" && step === 3) {
    return (
      <div className="sheet">
        <h2>Where do you work?</h2>
        {location}
        <button className="primary" type="button" onClick={() => { setServiceArea(`${area}, ${city}`); save(false); }}>Enter Service Centre</button>
      </div>
    );
  }

  return null;
}

import { useState } from "react";
import { finishOnboarding } from "@/lib/aloko.functions";

const TYPES = [
  { id: "buyer", label: "Buyer", line: "Find items and giveaways. Free. You never pay Aloko." },
  { id: "individual", label: "Individual Seller", line: "Sell your own things. Three listings are free." },
  { id: "business", label: "Business Seller", line: "A shop with a catalogue. Businesses pay Aloko." },
  { id: "service", label: "Decluttering Service", line: "Clear homes and offices. Providers pay Aloko." },
] as const;

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Benin City", "Kano"];

export function Onboarding({ onDone, onError }: { onDone: () => void; onError: (message: string) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<(typeof TYPES)[number]["id"]>("buyer");
  const [city, setCity] = useState("Lagos");
  const [interests, setInterests] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [serviceArea, setServiceArea] = useState("Lagos");

  return (
    <div className="sheet">
      <h2>{step === 1 ? "How will you use Aloko?" : "Your details"}</h2>
      <p className="type-lead">The account is created first. This screen chooses the type, then that type’s own checks. You can add another type later.</p>
      {step === 1 ? (
        <div className="types">
          {TYPES.map((item) => (
            <button key={item.id} type="button" className={role === item.id ? "type on" : "type"} onClick={() => setRole(item.id)}>
              <strong>{item.label}</strong>
              <span>{item.line}</span>
            </button>
          ))}
          <button className="primary" type="button" onClick={() => setStep(2)}>Continue</button>
        </div>
      ) : (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void finishOnboarding({ data: { role, city, interests, businessName, serviceArea } })
              .then(onDone)
              .catch((err: unknown) => onError(err instanceof Error ? err.message : "Could not finish setup."));
          }}
        >
          <label>
            City
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              {CITIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          {role === "buyer" ? (
            <label>What are you looking for?<input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Furniture, phones" /></label>
          ) : null}
          {role === "individual" ? <p className="type-lead">You can list 3 items free. Buyers pay you directly, not Aloko.</p> : null}
          {role === "business" ? (
            <label>Business name<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Registered name" /></label>
          ) : null}
          {role === "service" ? (
            <label>Where you work<input value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} placeholder="Lagos, Abuja" /></label>
          ) : null}
          <button className="ghost" type="button" onClick={() => setStep(1)}>Back</button>
          <button className="primary" type="submit">Finish</button>
        </form>
      )}
    </div>
  );
}

import { useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import {
  activateRole,
  createService,
  decideListing,
  decideService,
  grantModerator,
  reviewBusiness,
  saveMyProfile,
  setActiveRole,
  setListingState,
  setSuspended,
  submitVerification,
  type AlokoRole,
  type DashboardData,
} from "@/lib/aloko.functions";

const PUBLIC: { id: AlokoRole; label: string }[] = [
  { id: "buyer", label: "Buyer" },
  { id: "individual", label: "Individual Seller" },
  { id: "business", label: "Business Seller" },
  { id: "service", label: "Decluttering Service" },
];

const TITLES: Record<AlokoRole, string> = {
  buyer: "My Aloko",
  individual: "Seller Studio",
  business: "Business Centre",
  service: "Service Centre",
  moderator: "Operations Centre",
  super_admin: "Aloko Control Centre",
};

function money(value: number) {
  return value === 0 ? "Free" : `₦${value.toLocaleString("en-NG")}`;
}

export function Workspace({
  data,
  onRefresh,
  onSell,
  onDiscover,
  onGiveaways,
  onError,
}: {
  data: DashboardData;
  onRefresh: () => void;
  onSell: () => void;
  onDiscover: () => void;
  onGiveaways: () => void;
  onError: (message: string) => void;
}) {
  const { profile } = data;
  const role = profile.accountType;
  const [name, setName] = useState(profile.displayName);
  const [city, setCity] = useState(profile.city || "Lagos");
  const [interests, setInterests] = useState(profile.interests);
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [cacRef, setCacRef] = useState(profile.cacRef);
  const [service, setService] = useState({ title: "", description: "", areas: "Lagos", priceNote: "Request a quote" });
  const [staffEmail, setStaffEmail] = useState("");

  const run = (work: Promise<unknown>) => {
    void work.then(onRefresh).catch((err: unknown) => onError(err instanceof Error ? err.message : "That did not save."));
  };

  return (
    <div className="sheet">
      <h2>{TITLES[role]}</h2>
      <div className="switcher" role="tablist" aria-label="Dashboards on this account">
        {profile.roles.map((item) => (
          <button key={item} className={item === role ? "chip on" : "chip"} type="button" onClick={() => run(setActiveRole({ data: item }))}>
            {item === "super_admin" ? "Super admin" : item === "moderator" ? "Moderator" : PUBLIC.find((entry) => entry.id === item)?.label}
          </button>
        ))}
      </div>
      {PUBLIC.filter((item) => !profile.roles.includes(item.id)).length > 0 && (
        <div className="switcher">
          {PUBLIC.filter((item) => !profile.roles.includes(item.id)).map((item) => (
            <button key={item.id} className="chip" type="button" onClick={() => run(activateRole({ data: item.id as "buyer" | "individual" | "business" | "service" }))}>
              Add {item.label}
            </button>
          ))}
        </div>
      )}
      {profile.suspended && <p className="err">This account is suspended.</p>}

      {role === "buyer" && (
        <>
          <div className="stats">
            <div className="stat"><b>{data.saves.length}</b><span>Saved</span></div>
            <div className="stat"><b>{data.threads.length}</b><span>Messages</span></div>
          </div>
          <p className="type-lead">Buyers are free. Aloko does not charge you to browse.</p>
          <div className="type-actions">
            <button className="primary" type="button" onClick={onDiscover}>Discover</button>
            <button className="ghost" type="button" onClick={onGiveaways}>Giveaways</button>
          </div>
          <h3 className="mine-head">Recently viewed</h3>
          {data.recent.length === 0 ? <p className="type-lead">Open a listing and it will show up here.</p> : data.recent.map((item) => <p key={item.id} className="type-lead">{item.title}</p>)}
          <form className="form" onSubmit={(event) => { event.preventDefault(); run(saveMyProfile({ data: { displayName: name, serviceArea: profile.serviceArea, businessName: profile.businessName, city, interests } })); }}>
            <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>City<input value={city} onChange={(event) => setCity(event.target.value)} /></label>
            <label>Interests<input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Furniture, phones" /></label>
            <button className="primary" type="submit">Save profile</button>
          </form>
        </>
      )}

      {role === "individual" && (
        <>
          <div className="stats">
            <div className="stat"><b>{data.listings.filter((item) => item.status === "active" && !item.sold).length}</b><span>Live</span></div>
            <div className="stat"><b>{data.creditsLeft}</b><span>Free listings left</span></div>
          </div>
          <p className="type-lead">Three listings are free. Packages are not open yet, so a fourth listing waits.</p>
          <button className="primary" type="button" onClick={onSell}>Add listing</button>
          <ListingList listings={data.listings} onRefresh={onRefresh} onError={onError} />
        </>
      )}

      {role === "business" && (
        <>
          <p className="type-lead">Verification: {profile.verification}. Individual sellers do not need CAC. A business can submit a CAC reference.</p>
          <form className="form" onSubmit={(event) => { event.preventDefault(); run(submitVerification({ data: { businessName, cacRef } })); }}>
            <label>Business name<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label>
            <label>CAC reference<input value={cacRef} onChange={(event) => setCacRef(event.target.value)} placeholder="RC number" /></label>
            <button className="primary" type="submit">Submit for verification</button>
          </form>
          <p className="type-lead">{data.creditsLeft} catalogue spaces left before subscriptions open. Bulk upload and team seats are not open yet.</p>
          <button className="primary" type="button" onClick={onSell}>Add product</button>
          <ListingList listings={data.listings} onRefresh={onRefresh} onError={onError} />
        </>
      )}

      {role === "service" && (
        <>
          <form className="form" onSubmit={(event) => { event.preventDefault(); run(createService({ data: service }).then(() => setService({ title: "", description: "", areas: service.areas, priceNote: service.priceNote }))); }}>
            <label>Service<input value={service.title} onChange={(event) => setService({ ...service, title: event.target.value })} placeholder="Home decluttering" /></label>
            <label>What you do<textarea value={service.description} onChange={(event) => setService({ ...service, description: event.target.value })} /></label>
            <label>Areas<input value={service.areas} onChange={(event) => setService({ ...service, areas: event.target.value })} /></label>
            <label>Price<input value={service.priceNote} onChange={(event) => setService({ ...service, priceNote: event.target.value })} /></label>
            <button className="primary" type="submit">Publish service</button>
          </form>
          <div className="queue">
            {data.services.map((item) => (
              <article key={item.id} className="queue-card">
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.areas} · {item.priceNote} · {item.status}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {(role === "moderator" || role === "super_admin") && (
        <>
          <h3 className="mine-head">Listing moderation</h3>
          {data.queue.length === 0 ? <p className="type-lead">No listings are waiting.</p> : data.queue.map((item) => (
            <article key={item.id} className="queue-card">
              <img src={item.image} alt="" />
              <div>
                <strong>{item.title}</strong>
                <span>{item.productCode} · {money(item.price)} · {item.city}</span>
                <div className="queue-actions">
                  <button className="primary" type="button" onClick={() => run(decideListing({ data: { id: item.id, status: "active" } }))}>Approve</button>
                  <button className="ghost" type="button" onClick={() => run(decideListing({ data: { id: item.id, status: "rejected" } }))}>Reject</button>
                </div>
              </div>
            </article>
          ))}
          <h3 className="mine-head">Service moderation</h3>
          {data.serviceQueue.length === 0 ? <p className="type-lead">No services are waiting.</p> : data.serviceQueue.map((item) => (
            <article key={item.id} className="queue-card">
              <div>
                <strong>{item.title}</strong>
                <span>{item.areas}</span>
                <div className="queue-actions">
                  <button className="primary" type="button" onClick={() => run(decideService({ data: { id: item.id, status: "active" } }))}>Approve</button>
                  <button className="ghost" type="button" onClick={() => run(decideService({ data: { id: item.id, status: "rejected" } }))}>Reject</button>
                </div>
              </div>
            </article>
          ))}
        </>
      )}

      {role === "super_admin" && (
        <>
          <h3 className="mine-head">People</h3>
          <form className="form" onSubmit={(event) => { event.preventDefault(); run(grantModerator({ data: staffEmail })); }}>
            <label>Make this email a moderator<input value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} placeholder="name@email.com" /></label>
            <button className="primary" type="submit">Grant moderator</button>
          </form>
          <div className="queue">
            {data.people.map((person) => (
              <article key={person.id} className="queue-card">
                <div>
                  <strong>{person.name || person.email}</strong>
                  <span>{person.email} · {person.roles.join(", ") || "buyer"} · {person.verification}</span>
                  <div className="queue-actions">
                    {person.verification === "submitted" && (
                      <button className="primary" type="button" onClick={() => run(reviewBusiness({ data: { userId: person.id, verification: "approved" } }))}>Verify</button>
                    )}
                    <button className="ghost" type="button" onClick={() => run(setSuspended({ data: { userId: person.id, suspended: !person.suspended } }))}>
                      {person.suspended ? "Restore" : "Suspend"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <h3 className="mine-head">Audit</h3>
          {data.audit.map((item) => <p key={item.id} className="type-lead">{item.action} · {item.target}</p>)}
        </>
      )}

      <UserButton />
    </div>
  );
}

function ListingList({ listings, onRefresh, onError }: { listings: DashboardData["listings"]; onRefresh: () => void; onError: (message: string) => void }) {
  const run = (work: Promise<unknown>) => {
    void work.then(onRefresh).catch((err: unknown) => onError(err instanceof Error ? err.message : "That did not save."));
  };
  if (listings.length === 0) return <p className="type-lead">No listings yet.</p>;
  return (
    <div className="queue">
      {listings.map((item) => (
        <article key={item.id} className="queue-card">
          <img src={item.image} alt="" />
          <div>
            <strong>{item.title}</strong>
            <span>{item.productCode || "Pending code"} · {item.sold ? "Sold" : item.status}{item.paused && !item.sold ? " · Paused" : ""} · stock {item.stock}</span>
            {!item.sold && item.status !== "rejected" && (
              <div className="queue-actions">
                <button className="ghost" type="button" onClick={() => run(setListingState({ data: { id: item.id, action: item.paused ? "resume" : "pause" } }))}>{item.paused ? "Resume" : "Pause"}</button>
                <button className="ghost" type="button" onClick={() => run(setListingState({ data: { id: item.id, action: "sold" } }))}>Mark sold</button>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

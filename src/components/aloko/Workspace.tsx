import { useEffect, useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { SaleRecord } from "@/components/aloko/ChatDesk";
import {
  activateRole,
  createService,
  decideListing,
  decideService,
  grantModerator,
  placeOrder,
  confirmOrder,
  postTape,
  decideTape,
  reviewBusiness,
  saveMyProfile,
  setActiveRole,
  setListingState,
  setSuspended,
  submitVerification,
  listTickets,
  replyTicket,
  type AlokoRole,
  type DashboardData,
  type HomeSection,
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
  home,
  onHome,
}: {
  data: DashboardData;
  onRefresh: () => void;
  onSell: () => void;
  onDiscover: () => void;
  onGiveaways: () => void;
  onError: (message: string) => void;
  home: HomeSection[];
  onHome: (id: string, change: { enabled?: boolean; direction?: "up" | "down" }) => void;
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
  const [tickets, setTickets] = useState<{ id: string; subject: string; email: string; status: string }[]>([]);
  const [ticketReply, setTicketReply] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role !== "moderator" && role !== "super_admin") return;
    listTickets().then(setTickets).catch(() => setTickets([]));
  }, [role, data]);

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
          <h3 className="mine-head">My deals</h3>
          {data.deals.length === 0 ? <p className="type-lead">Nothing agreed yet. Negotiate in the chat. You pay the seller, not Aloko.</p> : data.deals.map((item) => (
            <p key={item.id} className="type-lead">{item.title} · {item.soldPrice != null ? money(item.soldPrice) : "Agreed"} · {item.city}</p>
          ))}
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
          <p className="type-lead">Three listings are free. Another one is ₦1,000, and it opens only after Aloko confirms the payment. No card is charged in the app.</p>
          <button className="ghost" type="button" onClick={() => run(placeOrder({ data: { kind: "extra_listing" } }))}>Buy one listing · ₦1,000</button>
          <button className="primary" type="button" onClick={onSell}>Add listing</button>
          {data.orders.length > 0 && <h3 className="mine-head">Payments</h3>}
          {data.orders.map((item) => <p key={item.id} className="type-lead">{item.kind.replaceAll("_", " ")} · {money(item.amount)} · {item.status}</p>)}
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
          <p className="type-lead">{data.creditsLeft} catalogue spaces left. A confirmed business month opens 100. No card is charged in the app.</p>
          <button className="ghost" type="button" onClick={() => run(placeOrder({ data: { kind: "business_month" } }))}>Business month · ₦12,000</button>
          <button className="primary" type="button" onClick={onSell}>Add product</button>
          <TapeDesk free={data.tapeFree} lines={data.tape} onRefresh={onRefresh} onError={onError} />
          <ListingList listings={data.listings} onRefresh={onRefresh} onError={onError} />
        </>
      )}

      {role === "service" && (
        <>
          <button className="ghost" type="button" onClick={() => run(placeOrder({ data: { kind: "service_month" } }))}>Service month · ₦6,000</button>
          <TapeDesk free={data.tapeFree} lines={data.tape} onRefresh={onRefresh} onError={onError} />
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
          <h3 className="mine-head">Tape waiting</h3>
          {data.tapeQueue.length === 0 ? <p className="type-lead">No tape lines are waiting. A paid line appears here only after the ₦5,000 is confirmed.</p> : data.tapeQueue.map((item) => (
            <article key={item.id} className="queue-card">
              <div>
                <strong>{item.seller}</strong>
                <span>{item.body} · {item.kind}</span>
                <div className="queue-actions">
                  <button className="primary" type="button" onClick={() => run(decideTape({ data: { id: item.id, status: "active" } }))}>Approve</button>
                  <button className="ghost" type="button" onClick={() => run(decideTape({ data: { id: item.id, status: "rejected" } }))}>Reject</button>
                </div>
              </div>
            </article>
          ))}
          <h3 className="mine-head">Support tickets</h3>
          {tickets.length === 0 ? <p className="type-lead">No one is waiting on support.</p> : tickets.map((item) => (
            <article key={item.id} className="queue-card">
              <div>
                <strong>{item.subject}</strong>
                <span>{item.email} · {item.status}</span>
                <input value={ticketReply[item.id] ?? ""} onChange={(event) => setTicketReply({ ...ticketReply, [item.id]: event.target.value })} placeholder="Reply as Aloko" />
                <div className="queue-actions">
                  <button className="primary" type="button" onClick={() => run(replyTicket({ data: { id: item.id, body: ticketReply[item.id] ?? "" } }).then(() => listTickets().then(setTickets)))}>Reply</button>
                </div>
              </div>
            </article>
          ))}
        </>
      )}

      {role === "super_admin" && (
        <>
          <h3 className="mine-head">Home sections</h3>
          <p className="type-lead">A section only appears when real listings match it. Hide or reorder them here.</p>
          {home.map((section) => (
            <article key={section.id} className="queue-card">
              <div>
                <strong>{section.title}</strong>
                <span>{section.enabled ? "On the home" : "Hidden"}</span>
                <div className="queue-actions">
                  <button className="ghost" type="button" onClick={() => onHome(section.id, { direction: "up" })}>Up</button>
                  <button className="ghost" type="button" onClick={() => onHome(section.id, { direction: "down" })}>Down</button>
                  <button className="primary" type="button" onClick={() => onHome(section.id, { enabled: !section.enabled })}>{section.enabled ? "Hide" : "Show"}</button>
                </div>
              </div>
            </article>
          ))}
          <h3 className="mine-head">Payments waiting</h3>
          {data.waitingOrders.length === 0 ? <p className="type-lead">No payments are waiting.</p> : data.waitingOrders.map((item) => (
            <article key={item.id} className="queue-card">
              <div>
                <strong>{item.email}</strong>
                <span>{item.kind.replaceAll("_", " ")} · {money(item.amount)}</span>
                <div className="queue-actions">
                  <button className="primary" type="button" onClick={() => run(confirmOrder({ data: item.id }))}>Confirm payment</button>
                </div>
              </div>
            </article>
          ))}
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

function TapeDesk({ free, lines, onRefresh, onError }: { free: number; lines: DashboardData["tape"]; onRefresh: () => void; onError: (message: string) => void }) {
  const [body, setBody] = useState("");
  return (
    <form className="form" onSubmit={(event) => {
      event.preventDefault();
      void postTape({ data: body })
        .then(() => {
          setBody("");
          onRefresh();
        })
        .catch((err: unknown) => onError(err instanceof Error ? err.message : "That line did not send."));
    }}>
      <h3 className="mine-head">NOW tape</h3>
      <p className="type-lead">{free} free lines left this week. After that, a line is ₦5,000. It stays off the tape until Aloko approves the words. A paid line also waits until the payment is confirmed.</p>
      <label>Line<input value={body} maxLength={80} onChange={(event) => setBody(event.target.value)} placeholder="Clear-outs in Lekki this week" /></label>
      <button className="primary" type="submit">Send this line</button>
      {lines.map((item) => <p key={item.id} className="type-lead">{item.body} · {item.kind} · {item.status}</p>)}
    </form>
  );
}

function ListingList({ listings, onRefresh, onError }: { listings: DashboardData["listings"]; onRefresh: () => void; onError: (message: string) => void }) {
  const [sale, setSale] = useState<DashboardData["listings"][number] | null>(null);
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
            <button className="linkish" type="button" onClick={() => item.sold && setSale(item)}>
              <strong>{item.title} {item.negotiated ? <i className="neg-ico">N</i> : null}</strong>
            </button>
            <span>
              {item.productCode || "Pending code"} · {item.sold ? "Sold" : item.status}
              {item.sold && item.soldPrice != null && item.soldPrice !== item.price ? <s> ₦{item.price.toLocaleString("en-NG")}</s> : null}
              {item.sold && item.soldPrice != null ? ` ₦${item.soldPrice.toLocaleString("en-NG")}` : ""}
              {item.paused && !item.sold ? " · Paused" : ""} · stock {item.stock}
            </span>
            {!item.sold && item.status !== "rejected" && (
              <div className="queue-actions">
                <button className="ghost" type="button" onClick={() => run(setListingState({ data: { id: item.id, action: item.paused ? "resume" : "pause" } }))}>{item.paused ? "Resume" : "Pause"}</button>
                <button className="ghost" type="button" onClick={() => run(setListingState({ data: { id: item.id, action: "sold" } }))}>Mark sold</button>
                <button className="ghost" type="button" onClick={() => run(placeOrder({ data: { kind: "feature_listing", listingId: item.id } }))}>Feature 7 days · ₦2,500</button>
              </div>
            )}
          </div>
        </article>
      ))}
      {sale ? (
        <SaleRecord
          title={sale.title}
          asking={sale.price}
          soldPrice={sale.soldPrice}
          negotiated={sale.negotiated}
          buyerName={sale.buyerName}
          soldAt={sale.soldAt}
          city={sale.city}
          myStars={0}
          theirStars={0}
          onClose={() => setSale(null)}
        />
      ) : null}
    </div>
  );
}

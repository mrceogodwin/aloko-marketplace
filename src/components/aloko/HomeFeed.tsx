import { Fragment, useEffect, useMemo, useRef, useState } from "react";

export type HomeItem = {
  id: string;
  title: string;
  price: number;
  city: string;
  category: string;
  kind: "sale" | "giveaway" | "bulk";
  image: string;
  verified: boolean;
  condition?: string;
  seller: string;
  area?: string;
  featured?: boolean;
  coverage?: string;
  was?: number | null;
};

type Lane = "all" | "sale" | "giveaway" | "bulk" | "service";

const LINES = [
  { a: "Your app to find", b: "verified sellers." },
  { a: "Declutter services", b: "just for better." },
  { a: "Give it a", b: "new home." },
  { a: "Declutter service", b: "just got easier." },
  { a: "No more", b: "stressing around." },
  { a: "Sell what you", b: "no longer need." },
  { a: "Give it away", b: "for free." },
  { a: "Pass one box", b: "to many people." },
  { a: "Find a chair,", b: "a phone, a home." },
  { a: "Book someone", b: "to clear the house." },
  { a: "Pay the seller.", b: "Not Aloko." },
  { a: "Nigeria’s place", b: "to pass things on." },
];

const CHANNELS: { label: string; image: string; kind: "all" | HomeItem["kind"]; category: string }[] = [
  { label: "Phones", image: "/aloko/phone.jpg", kind: "all", category: "Electronics" },
  { label: "Kitchen", image: "/aloko/blender.jpg", kind: "all", category: "Home & Living" },
  { label: "Baby", image: "/aloko/chair.jpg", kind: "giveaway", category: "Home & Living" },
  { label: "Books", image: "/aloko/chair.jpg", kind: "giveaway", category: "All" },
  { label: "Office", image: "/aloko/sofa.jpg", kind: "bulk", category: "Furniture" },
  { label: "Vehicles", image: "/aloko/weights.jpg", kind: "all", category: "Vehicles" },
  { label: "Electronics", image: "/aloko/laptop.jpg", kind: "all", category: "Electronics" },
  { label: "Furniture", image: "/aloko/sofa.jpg", kind: "all", category: "Furniture" },
  { label: "Fashion", image: "/aloko/sneaker.jpg", kind: "all", category: "Fashion" },
  { label: "Home", image: "/aloko/blender.jpg", kind: "all", category: "Home & Living" },
  { label: "Sports", image: "/aloko/weights.jpg", kind: "all", category: "Sports" },
  { label: "Beds", image: "/aloko/sofa.jpg", kind: "all", category: "Beds" },
  { label: "Generators", image: "/aloko/weights.jpg", kind: "all", category: "Generators" },
  { label: "Appliances", image: "/aloko/blender.jpg", kind: "all", category: "Appliances" },
  { label: "Kids", image: "/aloko/chair.jpg", kind: "all", category: "Kids" },
  { label: "Garden", image: "/aloko/hero.jpg", kind: "all", category: "Garden" },
  { label: "Tools", image: "/aloko/weights.jpg", kind: "all", category: "Tools" },
  { label: "Music", image: "/aloko/phone.jpg", kind: "all", category: "Music" },
  { label: "Beauty", image: "/aloko/sneaker.jpg", kind: "all", category: "Beauty" },
  { label: "Pets", image: "/aloko/chair.jpg", kind: "all", category: "Pets" },
  { label: "Storage", image: "/aloko/sofa.jpg", kind: "all", category: "Storage" },
];

const CAMPAIGNS: { id: string; kicker: string; title: string; line: string; image: string; kind: "all" | HomeItem["kind"]; category: string }[] = [
  { id: "c1", kicker: "Free", title: "Free furniture", line: "Pass a chair on.", image: "/aloko/chair.jpg", kind: "giveaway", category: "Furniture" },
  { id: "c2", kicker: "Bulk", title: "Office clear-outs", line: "One lot, many desks.", image: "/aloko/sofa.jpg", kind: "bulk", category: "Furniture" },
  { id: "c3", kicker: "First home", title: "First apartment", line: "The things a new room needs.", image: "/aloko/sofa.jpg", kind: "all", category: "Furniture" },
  { id: "c4", kicker: "Students", title: "Student budget", line: "Useful, and not new-shop prices.", image: "/aloko/blender.jpg", kind: "all", category: "Home & Living" },
  { id: "c5", kicker: "Phones", title: "Phones leaving home", line: "A second life for a handset.", image: "/aloko/phone.jpg", kind: "all", category: "Electronics" },
  { id: "c6", kicker: "Kitchen", title: "Kitchen pass-on", line: "Blenders, pots, the lot.", image: "/aloko/blender.jpg", kind: "all", category: "Home & Living" },
  { id: "c7", kicker: "Free", title: "Books for a child", line: "Give the pack away.", image: "/aloko/chair.jpg", kind: "giveaway", category: "All" },
  { id: "c8", kicker: "Sports", title: "Home gym, lightly used", line: "Weights that still work.", image: "/aloko/weights.jpg", kind: "all", category: "Sports" },
  { id: "c9", kicker: "Stores", title: "A business catalogue", line: "Shops that list in bulk.", image: "/aloko/laptop.jpg", kind: "bulk", category: "All" },
  { id: "c10", kicker: "Services", title: "Book a clear-out", line: "Someone comes to the house.", image: "/aloko/hero.jpg", kind: "all", category: "Services" },
  { id: "c11", kicker: "Pickup", title: "Collect this week", line: "Near the seller’s area.", image: "/aloko/sneaker.jpg", kind: "all", category: "All" },
];

const money = (value: number) =>
  value === 0 ? "Free" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

function cutOf(price: number, was?: number | null) {
  if (!was || was <= price || price <= 0) return 0;
  return Math.round((1 - price / was) * 100);
}

function place(item: HomeItem) {
  return item.area ? `${item.area}, ${item.city}` : item.city;
}

export function HomeFeed({
  items,
  saved,
  around,
  onOpen,
  onSave,
  onBrowse,
  onSell,
  onNear,
  onClearout,
  onInstall,
  onPricing,
  onAccount,
  tape,
  sections,
  services,
  ads,
  onService,
  onAdvertise,
}: {
  items: HomeItem[];
  saved: string[];
  around: { item: HomeItem; km: number }[];
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  onBrowse: (kind: "all" | HomeItem["kind"], category: string) => void;
  onSell: () => void;
  onNear: () => void;
  onClearout: () => void;
  onInstall: () => void;
  onPricing: () => void;
  onAccount: () => void;
  tape: { id: string; text: string; mark: string }[];
  sections: { id: string; title: string }[];
  services: { id: string; title: string; areas: string; priceNote: string }[];
  ads: { id: string; slot: string; image: string }[];
  onService: (service: { id: string; title: string; areas: string; priceNote: string }) => void;
  onAdvertise: (slot: "ribbon_picks" | "ribbon_drops" | "ribbon_furniture" | "portrait") => void;
}) {
  const [lane, setLane] = useState<Lane>("all");
  const [tabsOn, setTabsOn] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [about, setAbout] = useState(false);
  const [options, setOptions] = useState(false);
  const [mail, setMail] = useState("");
  const [listed, setListed] = useState(false);
  const [line, setLine] = useState(0);
  const [count, setCount] = useState(LINES[0].a.length + 1 + LINES[0].b.length);
  const [storyDone, setStoryDone] = useState(false);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const reduced = useRef(false);
  const lastY = useRef(0);

  useEffect(() => {
    const main = document.querySelector(".aloko-main");
    if (!main) return;
    const onScroll = () => {
      const y = main.scrollTop;
      setShowTop(y > 360);
      if (y < 28) setTabsOn(true);
      else if (y > lastY.current + 10) setTabsOn(false);
      else if (y < lastY.current - 10) setTabsOn(true);
      lastY.current = y;
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  const pool = lane === "all" || lane === "service" ? items : items.filter((item) => item.kind === lane);
  const rowsFor = (id: string) => {
    if (id === "just_listed") return pool.slice(0, 8);
    if (id === "free") return pool.filter((item) => item.kind === "giveaway");
    if (id === "near") return around.map((row) => row.item);
    if (id === "picks") return pool.filter((item) => item.kind === "sale").slice(0, 8);
    if (id === "clearout") return pool.filter((item) => item.kind === "bulk");
    if (id === "drops") return pool.filter((item) => (item.was ?? 0) > item.price);
    if (id === "good") return pool.filter((item) => item.condition === "Like new");
    if (id === "second") return pool.filter((item) => item.condition === "Good" && item.kind === "sale");
    if (id === "wardrobe") return pool.filter((item) => item.category === "Fashion");
    if (id === "electronics") return pool.filter((item) => item.category === "Electronics");
    if (id === "furniture") return pool.filter((item) => item.category === "Furniture");
    if (id === "home") return pool.filter((item) => item.category === "Home & Living");
    if (id === "verified") return pool.filter((item) => item.condition === "Fair");
    return [];
  };
  const slides = useMemo(() => {
    const cards: ({ type: "item"; item: HomeItem } | { type: "campaign"; id: string; kicker: string; title: string; line: string; image: string; kind: "all" | HomeItem["kind"]; category: string })[] = items.map((item) => ({ type: "item", item }));
    for (const campaign of CAMPAIGNS) cards.push({ type: "campaign", ...campaign });
    return cards.slice(0, 20);
  }, [items]);
  const total = 1 + slides.length;

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setStoryDone(true);
  }, []);

  useEffect(() => {
    if (storyDone || reduced.current) return;
    const full = `${LINES[line].a} ${LINES[line].b}`;
    if (count < full.length) {
      const timer = window.setTimeout(() => setCount((value) => value + 1), 36);
      return () => window.clearTimeout(timer);
    }
    if (line < LINES.length - 1) {
      const timer = window.setTimeout(() => {
        setLine((value) => value + 1);
        setCount(0);
      }, 850);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setStoryDone(true);
      setSlide(1);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [count, line, storyDone]);

  useEffect(() => {
    if (!storyDone || paused || reduced.current || total < 2) return;
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % total), 4200);
    return () => window.clearInterval(timer);
  }, [paused, storyDone, total]);

  const current = LINES[line];
  const full = `${current.a} ${current.b}`;
  const shown = full.slice(0, count);
  const split = current.a.length + 1;

  const go = (next: number) => setSlide((next + total) % total);

  return (
    <div className="home-fit">
      <div className={tabsOn ? "lane-bar" : "lane-bar hide"}>
        {tape.length > 0 && (
          <div className="live-tape" aria-label="Now on Aloko">
            <span className="live-mark">NOW</span>
            <div className="live-track">
              <div className="live-run">
                {[0, 1].map((copy) => (
                  <span key={copy}>
                    {tape.map((bit) => (
                      <i key={`${copy}-${bit.id}`}>
                        {bit.text} <em>{bit.mark}</em>
                        <b> · </b>
                      </i>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        <button className={lane === "all" ? "filter-btn" : "filter-btn on"} type="button" aria-label="Filter" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {filterOpen && (
          <div className="filter-menu" role="menu">
            {([
              ["all", "All"],
              ["sale", "For sale"],
              ["giveaway", "Free"],
              ["bulk", "Bulk"],
              ["service", "Services"],
            ] as const).map(([id, label]) => (
              <button key={id} className={lane === id ? "on" : ""} type="button" onClick={() => { setLane(id); setFilterOpen(false); }}>{label}</button>
            ))}
          </div>
        )}
      </div>

      <section
        className="hero"
        aria-label="Aloko"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          startX.current = event.clientX;
          startY.current = event.clientY;
          dragging.current = true;
          setPaused(true);
        }}
        onPointerUp={(event) => {
          if (!dragging.current) return;
          dragging.current = false;
          const dx = event.clientX - startX.current;
          const dy = event.clientY - startY.current;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
            setStoryDone(true);
            go(slide + (dx < 0 ? 1 : -1));
          }
          setPaused(false);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setPaused(false);
        }}
      >
        <div className="hero-track" style={{ ["--n" as string]: total, transform: `translateX(-${(slide * 100) / total}%)` }}>
          <div className="hero-slide">
            <div className="hero-art"><img src="/aloko/hero.jpg" alt="" /></div>
            <div className="hero-copy">
              <span className="eyebrow">NIGERIA’S REUSE & DECLUTTER MARKETPLACE</span>
              <p className="hero-lead">Find it. Sell it.</p>
              <h1 aria-live="polite">
                {shown.slice(0, split)}
                {shown.length > split && <em>{shown.slice(split)}</em>}
                <span className="caret" />
              </h1>
              <div className="hero-actions">
                <button className="btn-sell" type="button" onClick={onSell}><span>Start<br />Selling</span><span className="arrow">→</span></button>
                <button className="btn-browse" type="button" onClick={() => onBrowse("all", "All")}><span>Browse<br />Listings</span></button>
              </div>
            </div>
          </div>
          {slides.map((card) => (
            <div className="hero-slide" key={card.type === "item" ? card.item.id : card.id}>
              <div className="hero-art">
                <img src={card.type === "item" ? card.item.image : card.image} alt="" />
              </div>
              <button
                className="hero-copy hero-jump"
                type="button"
                onClick={() => (card.type === "item" ? onOpen(card.item.id) : card.category === "Services" ? onClearout() : onBrowse(card.kind, card.category))}
              >
                <span className="eyebrow">{card.type === "item" ? (card.item.kind === "giveaway" ? "FREE" : card.item.kind === "bulk" ? "BULK LOT" : "FOR SALE") : card.kicker}</span>
                <h2>{card.type === "item" ? card.item.title : card.title}</h2>
                <b>{card.type === "item" ? money(card.item.price) : card.line}</b>
                <span>{card.type === "item" ? place(card.item) : "Open this lane"}</span>
              </button>
            </div>
          ))}
        </div>
        <span className="hero-count">{slide + 1} / {total}</span>
        <button className="hero-nav prev" type="button" aria-label="Previous slide" onClick={() => { setStoryDone(true); go(slide - 1); }}>‹</button>
        <button className="hero-nav next" type="button" aria-label="Next slide" onClick={() => { setStoryDone(true); go(slide + 1); }}>›</button>
      </section>

      {lane === "service" ? (
        <div className="sheet">
          <h2>Decluttering services</h2>
          <p className="type-lead">Book a person or a crew to clear a home or an office. You pay them, not through Aloko.</p>
          <button className="seg-btn on" type="button" onClick={onClearout}>Ask about a clear-out</button>
        </div>
      ) : (
        <>
          <div className="quad">
            <button type="button" onClick={() => onBrowse("all", "All")}><b>Verified</b><span>Checked sellers</span></button>
            <button type="button" onClick={() => onBrowse("giveaway", "All")}><b>Free finds</b><span>₦0 pickup</span></button>
            <button type="button" onClick={onNear}><b>Near you</b><span>Your area</span></button>
            <button type="button" onClick={onClearout}><b>Clear-out</b><span>Book a crew</span></button>
          </div>

          <div className="cats" role="list">
            {CHANNELS.map((item) => (
              <button key={item.label} className="cat" type="button" onClick={() => onBrowse(item.kind, item.category)}>
                <img src={item.image} alt="" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="big-cats">
            {CHANNELS.slice(0, 6).map((item) => (
              <button key={item.label} className="big-cat" type="button" onClick={() => onBrowse(item.kind, item.category)}>
                <img src={item.image} alt="" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {sections.map((section) => {
            const slot = section.id === "picks" ? "ribbon_picks" : section.id === "drops" ? "ribbon_drops" : section.id === "furniture" ? "ribbon_furniture" : null;
            const rows = section.id === "services" ? [] : rowsFor(section.id);
            if (section.id === "services" ? services.length === 0 : rows.length === 0) return null;
            const body = section.id === "services" ? (
              services.length === 0 ? null : (
              <section key={section.id} className="featured">
                <Sep title={section.title} onAll={onClearout} />
                <div className="h-row">
                  {services.map((service) => (
                    <button key={service.id} className="service-card" type="button" onClick={() => onService(service)}>
                      <strong>{service.title}</strong>
                      <span>{service.areas}</span>
                      <em>{service.priceNote}</em>
                    </button>
                  ))}
                </div>
              </section>
              )
            ) : (
              <Row key={section.id} title={section.title} items={rows} saved={saved} onOpen={onOpen} onSave={onSave} onAll={() => onBrowse(section.id === "free" ? "giveaway" : section.id === "clearout" ? "bulk" : "all", section.id === "wardrobe" ? "Fashion" : section.id === "electronics" ? "Electronics" : section.id === "furniture" ? "Furniture" : section.id === "home" ? "Home & Living" : "All")} />
            );
            if (!slot) return body;
            return (
              <Fragment key={section.id}>
                <AdSlot ad={ads.find((item) => item.slot === slot)} slot={slot} onAdvertise={onAdvertise} />
                {body}
              </Fragment>
            );
          })}
          <div className="promos">
            <button className="promo dark" type="button" onClick={onClearout}>
              <b>Book Decluttering Services</b>
              <span className="promo-go">→</span>
            </button>
            <button className="promo lime" type="button" onClick={() => onBrowse("giveaway", "All")}>
              <b>Give Away for Free</b>
              <span className="promo-go">→</span>
            </button>
            <button className="promo pale" type="button" onClick={() => onBrowse("bulk", "All")}>
              <b>Bulk Deals & Clear-outs</b>
              <span className="promo-go">→</span>
            </button>
          </div>
          <AdSlot ad={ads.find((item) => item.slot === "portrait")} slot="portrait" onAdvertise={onAdvertise} />
        </>
      )}

      <footer className="aloko-foot">
        <h2 className="foot-brand">
          <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 4c10 16 22 30 22 42a22 22 0 0 1-44 0C10 34 22 20 32 4Z" fill="#c6f135" />
            <path d="M32 16v22" stroke="#012115" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="44" r="4.2" fill="#012115" />
          </svg>
          Aloko
        </h2>
        <div className="foot-decor" aria-hidden="true">
          <img className="foot-mat" src="/aloko/mat.jpg" alt="" />
          <img className="foot-bike" src="/aloko/bicycle.jpg" alt="" />
        </div>
        <p className={about ? "" : "clamp"}>
          Sell it. Give it. Pass it on. Aloko is Nigeria’s place for things that still have a life: sell what you no longer need, give it away, pass a box to many people, or book someone to clear the house. You pay the seller. Aloko does not take that money.
        </p>
        <button className="see-more" type="button" onClick={() => setAbout((open) => !open)}>{about ? "See less" : "See more →"}</button>
        <section className="devices" aria-label="Get Aloko on your devices">
          <div className="devices-copy">
            <h2>Get Aloko <em>on your devices</em></h2>
            <p>One account. Buy, sell, give and clear out anywhere.</p>
          </div>
          <div className="device-row">
            <article className="device web">
              <i className="device-check" aria-hidden="true">✓</i>
              <span className="device-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M4 12h16M12 4c2.2 2.4 3.3 5 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5-3.3-8s1.1-5.6 3.3-8z" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
              </span>
              <strong>Web App</strong>
              <small>Available now</small>
              <button type="button" onClick={onInstall}>Open Web App ↗</button>
            </article>
            <article className="device soon">
              <span className="device-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M7 8.5h10v8.2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8.5z" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M9 8.5 8 5.5M15 8.5l1-3M9 18.7v1.3M15 18.7v1.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </span>
              <strong>Android</strong>
              <small>Coming soon</small>
              <span className="soon-pill">Coming Soon</span>
            </article>
            <article className="device soon">
              <span className="device-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M16.2 7.2c.5-.7.9-1.6.8-2.6-.8.1-1.8.6-2.3 1.3-.5.6-.9 1.6-.8 2.5.9.1 1.8-.4 2.3-1.2zM16.9 9.4c-1.3-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7.9 1.5 2 2.5 1.9 1-.1 1.4-.6 2.6-.6s1.5.6 2.6.6 1.8-1 2.4-1.9c.8-1.1 1.1-2.2 1.1-2.3-2.4-1-2.1-4.4.7-5.3-.7-1.1-1.8-1.5-2.4-1.4z" fill="currentColor" /></svg>
              </span>
              <strong>iOS</strong>
              <small>Coming soon</small>
              <span className="soon-pill">Coming Soon</span>
            </article>
          </div>
        </section>
        <form className="deals" onSubmit={(event) => {
          event.preventDefault();
          if (!mail.includes("@")) return;
          const key = "aloko-finds";
          const old = JSON.parse(localStorage.getItem(key) || "[]") as string[];
          if (!old.includes(mail)) localStorage.setItem(key, JSON.stringify([...old, mail]));
          setListed(true);
          setMail("");
        }}>
          <b>Get the latest finds</b>
          {listed ? <p>Saved on this phone. The mail list is not sending yet.</p> : (
            <div>
              <input aria-label="Email address" placeholder="Email address" type="email" required value={mail} onChange={(event) => setMail(event.target.value)} />
              <button type="submit">Subscribe</button>
            </div>
          )}
        </form>
        <button className="more-options" type="button" aria-expanded={options} onClick={() => setOptions((open) => !open)}>
          More options <span>{options ? "⌃" : "⌄"}</span>
        </button>
        {options && (
          <div className="option-list">
            <button type="button" onClick={onPricing}>Pricing</button>
            <button type="button" onClick={onSell}>Start selling</button>
            <button type="button" onClick={onAccount}>Account</button>
            <button type="button" onClick={onClearout}>Book a clear-out</button>
          </div>
        )}
        <small className="copy">Copyright © 2026 Aloko. Sell it. Give it. Pass it on.</small>
        <small className="powered">Powered by <b>Cookit Technologies Ltd.</b></small>
      </footer>
      <button className={showTop ? "to-top show" : "to-top"} type="button" aria-label="Back to top" onClick={() => document.querySelector(".aloko-main")?.scrollTo({ top: 0, behavior: "smooth" })}>↑</button>
    </div>
  );
}

function AdSlot({
  ad,
  slot,
  onAdvertise,
}: {
  ad?: { id: string; image: string };
  slot: "ribbon_picks" | "ribbon_drops" | "ribbon_furniture" | "portrait";
  onAdvertise: (slot: "ribbon_picks" | "ribbon_drops" | "ribbon_furniture" | "portrait") => void;
}) {
  if (slot === "portrait") {
    return (
      <button className="portrait-ad" type="button" onClick={() => { if (!ad) onAdvertise(slot); }}>
        <img src={ad?.image || "/aloko/promote.jpg"} alt={ad ? "" : "Promote your items, services or business on Aloko"} />
      </button>
    );
  }
  if (ad) return <div className="ribbon-ad live"><img src={ad.image} alt="" /></div>;
  return (
    <button className="ribbon-ad" type="button" onClick={() => onAdvertise(slot)}>
      <strong>Ad space</strong>
      <span>Open this week</span>
    </button>
  );
}

const LANE_LINE: Record<string, string> = {
  "Just listed": "Fresh from people and shops.",
  "Pass it on": "Free, if you can collect it.",
  "Near you": "Around the area you chose.",
  "This week’s picks": "Useful things from the live list.",
  "Clear-out finds": "Lots from a home or an office.",
  "Price drops": "The seller lowered the price.",
  "Good as new": "Marked like new by the seller.",
  "Second life": "Pre-loved, and ready to use.",
  "Wardrobe reboot": "Clothes, shoes and bags.",
  "Electronics worth buying": "Phones, laptops and the rest.",
  "Furniture around you": "Chairs, sofas and tables.",
  "Home essentials": "For a room that still needs things.",
  "Still useful": "Fair condition. Not for the bin.",
  "Need help clearing out?": "People who clear homes and offices.",
};

const LANE_MARK: Record<string, { mark: string; tone: "lime" | "cream" | "leaf" }> = {
  "Just listed": { mark: "New", tone: "lime" },
  "Pass it on": { mark: "Free", tone: "cream" },
  "Near you": { mark: "Near", tone: "leaf" },
  "This week’s picks": { mark: "Pick", tone: "lime" },
  "Clear-out finds": { mark: "Lot", tone: "cream" },
  "Price drops": { mark: "Cut", tone: "leaf" },
  "Good as new": { mark: "Fine", tone: "lime" },
  "Second life": { mark: "2nd", tone: "cream" },
  "Wardrobe reboot": { mark: "Fit", tone: "leaf" },
  "Electronics worth buying": { mark: "Tech", tone: "lime" },
  "Furniture around you": { mark: "Room", tone: "cream" },
  "Home essentials": { mark: "Home", tone: "leaf" },
  "Still useful": { mark: "Fair", tone: "cream" },
  "Need help clearing out?": { mark: "Crew", tone: "lime" },
};

function Sep({ title, line, onAll }: { title: string; line?: string; onAll: () => void }) {
  const meta = LANE_MARK[title] || { mark: title.slice(0, 3), tone: "leaf" as const };
  return (
    <div className={`lane-sep tone-${meta.tone}`}>
      <span className="lane-mark">{meta.mark}</span>
      <div>
        <h2>{title}</h2>
        {line ? <p>{line}</p> : null}
      </div>
      <button type="button" onClick={onAll}>See all</button>
    </div>
  );
}

function Row({
  title,
  note,
  items,
  saved,
  onOpen,
  onSave,
  onAll,
}: {
  title: string;
  note?: string;
  items: HomeItem[];
  saved: string[];
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  onAll: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="featured">
      <Sep title={title} line={note || LANE_LINE[title]} onAll={onAll} />
      <div className="h-row">
        {items.map((item) => (
          <Card key={item.id} item={item} saved={saved.includes(item.id)} onOpen={onOpen} onSave={onSave} />
        ))}
      </div>
    </section>
  );
}

function Card({ item, saved, onOpen, onSave, extra }: { item: HomeItem; saved: boolean; onOpen: (id: string) => void; onSave: (id: string) => void; extra?: string }) {
  return (
    <article className="listing">
      <button className="listing-hit" type="button" onClick={() => onOpen(item.id)}>
        <div className="listing-photo"><img src={item.image} alt="" /></div>
        <div className="listing-copy">
          <strong>{item.title}</strong>
          <span className="price-line">
            <b>{money(item.price)}</b>
            {cutOf(item.price, item.was) > 0 && item.was ? <s>{money(item.was)}</s> : null}
            {cutOf(item.price, item.was) > 0 ? <em>-{cutOf(item.price, item.was)}%</em> : null}
          </span>
          {item.condition ? <span className="cond">{item.condition}</span> : null}
          <span className="place">
            {place(item)}{extra ? ` · ${extra}` : ""}
            {item.verified ? <i className="tick" title="Aloko verified this business">✓</i> : null}
          </span>
        </div>
      </button>
      <button className={saved ? "heart on" : "heart"} type="button" aria-label={saved ? "Unsave" : "Save"} onClick={() => onSave(item.id)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
      </button>
    </article>
  );
}

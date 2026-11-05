import { useEffect, useMemo, useRef, useState } from "react";

export type HomeItem = {
  id: string;
  title: string;
  price: number;
  city: string;
  category: string;
  kind: "sale" | "giveaway" | "bulk";
  image: string;
  verified: boolean;
  seller: string;
  area?: string;
  featured?: boolean;
  coverage?: string;
  was?: number | null;
};

type Lane = "all" | "sale" | "giveaway" | "bulk" | "service";

const LINES = [
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
}) {
  const [lane, setLane] = useState<Lane>("all");
  const [tabsOn, setTabsOn] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
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
  const reduced = useRef(false);
  const lastY = useRef(0);

  useEffect(() => {
    const main = document.querySelector(".aloko-main");
    if (!main) return;
    const onScroll = () => {
      const y = main.scrollTop;
      if (y < 28) setTabsOn(true);
      else if (y > lastY.current + 10) setTabsOn(false);
      else if (y < lastY.current - 10) setTabsOn(true);
      lastY.current = y;
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  const pool = lane === "all" || lane === "service" ? items : items.filter((item) => item.kind === lane);
  const paid = items.filter((item) => item.featured);
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
        <button className="filter-btn" type="button" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
          Filter · {lane === "all" ? "All" : lane === "sale" ? "For sale" : lane === "giveaway" ? "Free" : lane === "bulk" ? "Bulk" : "Services"}
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
          startX.current = event.clientX;
          setPaused(true);
        }}
        onPointerUp={(event) => {
          const delta = event.clientX - startX.current;
          if (delta > 40) go(slide - 1);
          if (delta < -40) {
            setStoryDone(true);
            go(slide + 1);
          }
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
              <div className="pips" aria-hidden="true">
                {LINES.map((_, index) => <i key={index} className={index <= line ? "on" : ""} />)}
              </div>
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

          <Row title="This week’s picks" items={pool.slice(0, 8)} saved={saved} onOpen={onOpen} onSave={onSave} onAll={() => onBrowse(lane === "all" ? "all" : lane, "All")} />
          <section className="featured">
            <div className="section-head"><h2>Moving now</h2></div>
            <div className="move-grid">
              {pool.slice(0, 4).map((item) => (
                <Card key={item.id} item={item} saved={saved.includes(item.id)} onOpen={onOpen} onSave={onSave} />
              ))}
            </div>
          </section>

          {paid[0] && (
            <button className="ad-banner" type="button" onClick={() => onOpen(paid[0].id)}>
              <span>Paid this week · stays inside Aloko</span>
              <strong>{paid[0].seller}</strong>
              <em>{paid[0].title}</em>
            </button>
          )}

          <Row title="Pickup this week" items={pool.filter((item) => item.coverage !== "nationwide").slice(0, 8)} saved={saved} onOpen={onOpen} onSave={onSave} onAll={() => onBrowse("all", "All")} />

          {paid.length > 0 && [...new Set(paid.map((item) => item.seller))].map((seller) => (
            <Row
              key={seller}
              title={seller}
              note="This week"
              items={paid.filter((item) => item.seller === seller)}
              saved={saved}
              onOpen={onOpen}
              onSave={onSave}
              onAll={() => onBrowse("all", "All")}
            />
          ))}

          <Row title="Home faves" items={pool.filter((item) => item.category === "Furniture" || item.category === "Home & Living")} saved={saved} onOpen={onOpen} onSave={onSave} onAll={() => onBrowse("all", "Furniture")} />
          <Row title="Giveaways" items={pool.filter((item) => item.kind === "giveaway")} saved={saved} onOpen={onOpen} onSave={onSave} onAll={() => onBrowse("giveaway", "All")} />
          <Row title="Bulk lots" items={pool.filter((item) => item.kind === "bulk")} saved={saved} onOpen={onOpen} onSave={onSave} onAll={() => onBrowse("bulk", "All")} />
          <Row title="Hot this week" items={pool.filter((item) => item.verified)} saved={saved} onOpen={onOpen} onSave={onSave} onAll={() => onBrowse("all", "All")} />

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

          <Row title="Featured Listings" items={pool.filter((item) => item.kind === "sale").slice(0, 8)} saved={saved} onOpen={onOpen} onSave={onSave} onAll={() => onBrowse("all", "All")} />
          {around.length > 0 && (
            <section className="featured">
              <div className="section-head"><h2>Around you</h2></div>
              <div className="h-row">
                {around.map(({ item, km }) => (
                  <Card key={item.id} item={item} saved={saved.includes(item.id)} onOpen={onOpen} onSave={onSave} extra={`~${km} km`} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <footer className="aloko-foot">
        <h2>Aloko</h2>
        <p className={about ? "" : "clamp"}>
          Sell it. Give it. Pass it on. Aloko is Nigeria’s place for things that still have a life: sell what you no longer need, give it away, pass a box to many people, or book someone to clear the house. You pay the seller. Aloko does not take that money.
        </p>
        <button className="see-more" type="button" onClick={() => setAbout((open) => !open)}>{about ? "See less" : "See more"}</button>
        <button className="install-btn" type="button" onClick={onInstall}>Download our app</button>
        <a className="support" href="mailto:hello@aloko.ng">
          <span>✉</span>
          <b>Email support<small>hello@aloko.ng</small></b>
        </a>
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
      </footer>
      <button className="to-top" type="button" onClick={() => document.querySelector(".aloko-main")?.scrollTo({ top: 0, behavior: "smooth" })}>↑</button>
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
      <div className="section-head">
        <h2>{title}{note ? <small> {note}</small> : null}</h2>
        <button className="linkish" type="button" onClick={onAll}>See all</button>
      </div>
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
          <span className="place">{place(item)}{extra ? ` · ${extra}` : ""}</span>
        </div>
      </button>
      <button className={saved ? "heart on" : "heart"} type="button" aria-label={saved ? "Unsave" : "Save"} onClick={() => onSave(item.id)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
      </button>
      {item.verified && <span className="verified" title="Aloko verified this business">✓</span>}
    </article>
  );
}

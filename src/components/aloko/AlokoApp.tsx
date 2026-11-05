import { useEffect, useMemo, useRef, useState } from "react";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { activateRole, addTicketNote, createListing, decideListing, getDashboard, listAdSlots, listFollows, listHome, listLiveAds, listLiveListings, listLiveServices, listNotes, listTape, markNotesRead, openTicket, openThread, readTicket, recordView, reserveAd, saveRadius, setHomeSection, startCheckout, submitAd, toggleFollow, toggleSave, touchSeen, type AlokoRole, type AlokoRow, type DashboardData, type HomeSection, type TicketView } from "@/lib/aloko.functions";
import { ChatDesk } from "@/components/aloko/ChatDesk";
import { Onboarding } from "@/components/aloko/Onboarding";
import { Workspace } from "@/components/aloko/Workspace";
import { ListingMap } from "@/components/aloko/ListingMap";
import { HomeFeed } from "@/components/aloko/HomeFeed";
import { distanceKm, nearestPlace, placeFor } from "@/lib/places";

type Kind = "sale" | "giveaway" | "bulk";
type Tab = "home" | "buy" | "sell" | "messages" | "account";

type Listing = {
  id: string;
  title: string;
  price: number;
  city: string;
  category: string;
  kind: Kind;
  image: string;
  verified: boolean;
  condition: string;
  seller: string;
  description: string;
  status?: "pending" | "active" | "rejected";
  productCode?: string;
  paused?: boolean;
  sold?: boolean;
  stock?: number;
  soldPrice?: number | null;
  buyerName?: string;
  negotiated?: boolean;
  soldAt?: string | null;
  area?: string;
  state?: string;
  lat?: number | null;
  lng?: number | null;
  coverage?: string;
  featured?: boolean;
  was?: number | null;
  sellerId?: string;
  postedAt?: string | null;
  sellerOnline?: boolean;
};

const CATEGORIES = [
  { id: "Electronics", image: "/aloko/phone.jpg" },
  { id: "Furniture", image: "/aloko/chair.jpg" },
  { id: "Fashion", image: "/aloko/sneaker.jpg" },
  { id: "Home & Living", image: "/aloko/blender.jpg" },
  { id: "Sports", image: "/aloko/weights.jpg" },
  { id: "Beds", image: "/aloko/sofa.jpg" },
  { id: "Generators", image: "/aloko/weights.jpg" },
  { id: "Appliances", image: "/aloko/blender.jpg" },
  { id: "Kids", image: "/aloko/chair.jpg" },
  { id: "Garden", image: "/aloko/hero.jpg" },
  { id: "Tools", image: "/aloko/weights.jpg" },
  { id: "Music", image: "/aloko/phone.jpg" },
  { id: "Beauty", image: "/aloko/sneaker.jpg" },
  { id: "Pets", image: "/aloko/chair.jpg" },
  { id: "Storage", image: "/aloko/sofa.jpg" },
] as const;

type AccountType = AlokoRole;

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Benin City", "Kano"];
const STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"];
const STATE_CITIES: Record<string, string[]> = {
  Lagos: ["Lagos"],
  FCT: ["Abuja"],
  Rivers: ["Port Harcourt"],
  Oyo: ["Ibadan"],
  Enugu: ["Enugu"],
  Edo: ["Benin City"],
  Kano: ["Kano"],
};

const SEED: Listing[] = [
  {
    id: "iphone",
    title: "iPhone 14 Pro",
    price: 520000,
    city: "Lagos",
    category: "Electronics",
    kind: "sale",
    image: "/aloko/phone.jpg",
    verified: false,
    condition: "Like new",
    seller: "Tobi A.",
    description: "Deep purple, 128GB, battery health strong. Box and cable included. Pickup in Lekki or Island meetup.",
  },
  {
    id: "sofa",
    title: "2-Seater Sofa",
    price: 180000,
    city: "Abuja",
    category: "Furniture",
    kind: "sale",
    image: "/aloko/sofa.jpg",
    verified: false,
    condition: "Good",
    seller: "Amaka E.",
    description: "Emerald velvet two-seater from a Wuse apartment clear-out. No tears. Buyer arranges pickup.",
  },
  {
    id: "mac",
    title: "MacBook Pro",
    price: 750000,
    city: "Lagos",
    category: "Electronics",
    kind: "sale",
    image: "/aloko/laptop.jpg",
    verified: false,
    condition: "Good",
    seller: "Chinedu O.",
    description: "14-inch, used for design work. Light keyboard shine. Comes with charger. Yaba meetup.",
    was: 890000,
  },
  {
    id: "chair",
    title: "Mustard Lounge Chair",
    price: 95000,
    city: "Port Harcourt",
    category: "Furniture",
    kind: "sale",
    image: "/aloko/chair.jpg",
    verified: false,
    condition: "Good",
    seller: "Blessing T.",
    description: "Solid lounge chair from a GRA flat. One scuff on a rear leg. Can help load.",
  },
  {
    id: "sneaker",
    title: "White Court Sneakers",
    price: 42000,
    city: "Lagos",
    category: "Fashion",
    kind: "sale",
    image: "/aloko/sneaker.jpg",
    verified: false,
    condition: "Like new",
    seller: "Kemi S.",
    description: "Worn twice. Size 42. Clean soles. Ikeja pickup.",
  },
  {
    id: "blender",
    title: "Kitchen Blender",
    price: 28000,
    city: "Abuja",
    category: "Home & Living",
    kind: "sale",
    image: "/aloko/blender.jpg",
    verified: false,
    condition: "Good",
    seller: "Ngozi K.",
    description: "Blends smoothies fine. Jar is clear, lid seals. Gwarinpa pickup.",
  },
  {
    id: "weights",
    title: "Hex Dumbbell Pair",
    price: 35000,
    city: "Lagos",
    category: "Sports",
    kind: "sale",
    image: "/aloko/weights.jpg",
    verified: false,
    condition: "Good",
    seller: "Ifeanyi M.",
    description: "Pair of hex dumbbells from a home gym clear-out. Rubber ends intact.",
  },
  {
    id: "books",
    title: "Children story books",
    price: 0,
    city: "Abuja",
    category: "Home & Living",
    kind: "giveaway",
    image: "/aloko/chair.jpg",
    verified: false,
    condition: "Fair",
    seller: "Ada O.",
    description: "Pack of eight story books. Light pencil marks. Free to any parent. Gwarinpa pickup only.",
  },
  {
    id: "bulk",
    title: "Office clear-out lot",
    price: 120000,
    city: "Lagos",
    category: "Furniture",
    kind: "bulk",
    image: "/aloko/sofa.jpg",
    verified: true,
    condition: "Fair",
    seller: "Squad Desks",
    description: "Desks, chairs and a filing cabinet from a Victoria Island office move. Sold as one lot.",
    was: 180000,
  },
];

const SPOTS: Record<string, { area: string; coverage: string }> = {
  iphone: { area: "Lekki", coverage: "city" },
  sofa: { area: "Wuse", coverage: "city" },
  mac: { area: "Yaba", coverage: "neighbourhood" },
  chair: { area: "GRA", coverage: "city" },
  sneaker: { area: "Ikeja", coverage: "neighbourhood" },
  blender: { area: "Gwarinpa", coverage: "neighbourhood" },
  weights: { area: "Surulere", coverage: "city" },
  books: { area: "Gwarinpa", coverage: "neighbourhood" },
  bulk: { area: "Lekki", coverage: "nationwide" },
};

for (const item of SEED) {
  const spot = placeFor(item.city, SPOTS[item.id]?.area ?? "");
  item.area = spot?.area;
  item.state = spot?.state;
  item.lat = spot?.lat ?? null;
  item.lng = spot?.lng ?? null;
  item.coverage = SPOTS[item.id]?.coverage ?? "city";
}

function reach(coverage?: string) {
  if (coverage === "nationwide") return "Nationwide delivery";
  if (coverage === "state") return "Delivery in this state";
  if (coverage === "neighbourhood") return "Pickup in this area";
  return "Pickup, or delivery in this city";
}

const naira = (value: number) =>
  value === 0
    ? "Free"
    : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

function cutOf(price: number, was?: number | null) {
  if (!was || was <= price || price <= 0) return 0;
  return Math.round((1 - price / was) * 100);
}

function PriceLine({ price, was }: { price: number; was?: number | null }) {
  const cut = cutOf(price, was);
  return (
    <span className="price-line">
      <b>{naira(price)}</b>
      {cut > 0 && was ? <s>{naira(was)}</s> : null}
      {cut > 0 ? <em>-{cut}%</em> : null}
    </span>
  );
}

function Icon({ name }: { name: "bell" | "heart" | "menu" | "pin" | "search" | "camera" | "home" | "bag" | "plus" | "chat" | "user" | "layers" | "truck" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "bell")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15Z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    );
  if (name === "heart")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />
      </svg>
    );
  if (name === "menu")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  if (name === "pin")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    );
  if (name === "search")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    );
  if (name === "camera")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M4 8h3l1.4-2h7.2L17 8h3v11H4Z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    );
  if (name === "home")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="m4 11 8-7 8 7v9H4Z" />
      </svg>
    );
  if (name === "bag")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M6 8h12l1 12H5Z" />
        <path d="M9 8V7a3 3 0 0 1 6 0v1" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M12 6v12M6 12h12" />
      </svg>
    );
  if (name === "chat")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="M5 17.5 4 21l3.8-1.4A8.5 8.5 0 1 0 5 17.5Z" />
      </svg>
    );
  if (name === "user")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19.5a7 7 0 0 1 14 0" />
      </svg>
    );
  if (name === "layers")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
        <path d="m12 4 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 16 8 4 8-4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
      <path d="M3 15h11v4H3Z" />
      <path d="M14 16h4l3 3v-7h-7Z" />
      <circle cx="6.5" cy="19.5" r="1.4" />
      <circle cx="15" cy="19.5" r="1.4" />
    </svg>
  );
}

function isLive(item: Listing) {
  return !item.status || item.status === "active";
}

function readPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 720;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("photo"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("photo"));
    };
    img.src = url;
  });
}

function loadSaved() {
  try {
    const raw = localStorage.getItem("aloko:saved");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function fromRow(row: AlokoRow): Listing {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    city: row.city,
    category: row.category,
    kind: row.kind,
    image: row.image,
    condition: "Good",
    seller: row.seller,
    description: row.description,
    status: row.status,
    productCode: row.productCode,
    paused: row.paused,
    sold: row.sold,
    stock: row.stock,
    soldPrice: row.soldPrice,
    buyerName: row.buyerName,
    negotiated: row.negotiated,
    soldAt: row.soldAt,
    area: row.area,
    state: row.state,
    lat: row.lat,
    lng: row.lng,
    coverage: row.coverage,
    featured: row.featured,
    was: row.was,
    verified: row.verified,
    sellerId: row.sellerId,
    postedAt: row.postedAt,
    sellerOnline: row.sellerOnline,
  };
}

function SignInPanel({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"welcome" | "in" | "up" | "verify">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [display, setDisplay] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (mode === "welcome") {
    return (
      <div className="sheet">
        <h2>Sell it. Give it. Pass it on.</h2>
        <p className="type-lead">Discover great finds, sell things you no longer need, and give your belongings a second life.</p>
        <div className="form">
          <button className="primary" type="button" onClick={() => setMode("up")}>Create an account</button>
          <button className="ghost" type="button" onClick={() => setMode("in")}>Sign in</button>
          {GROK_PROVIDERS.map((provider) => (
            <button key={provider.providerId} className="ghost" type="button" onClick={() => signIn(provider.providerId, { callbackURL: "/" })}>
              Continue with {provider.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "verify") {
    return (
      <div className="sheet">
        <h2>Verify your account</h2>
        <p className="type-lead">Email delivery is not connected yet, so there is no code to enter. You can keep going. Phone checks come later, only when a listing or a service needs more trust.</p>
        <button className="primary" type="button" onClick={onDone}>Continue</button>
        <button className="ghost" type="button" onClick={() => setMode("up")}>Change email address</button>
      </div>
    );
  }

  return (
    <form
      className="sheet form"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        if (mode === "up") {
          if (password !== confirm) {
            setError("The passwords do not match.");
            return;
          }
          if (!agreed) {
            setError("Agree to the terms to create an account.");
            return;
          }
        }
        setBusy(true);
        const run =
          mode === "up"
            ? authClient.signUp.email({ email, password, name: display.trim() || "Aloko member", callbackURL: "/" })
            : authClient.signIn.email({ email, password, callbackURL: "/" });
        void run
          .then((result) => {
            if (result.error) throw new Error(result.error.message || "Could not sign in.");
            if (mode === "up") setMode("verify");
            else onDone();
          })
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not sign in."))
          .finally(() => setBusy(false));
      }}
    >
      <h2>{mode === "up" ? "Create your account" : "Sign in"}</h2>
      {mode === "up" && (
        <label>
          Full name
          <input value={display} onChange={(event) => setDisplay(event.target.value)} autoComplete="name" required />
        </label>
      )}
      <label>
        Email address
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
      </label>
      <label>
        Password
        <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} />
      </label>
      {mode === "up" && (
        <label>
          Confirm password
          <input type="password" required minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
        </label>
      )}
      {mode === "up" && (
        <label className="check">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          I agree to the Terms and Privacy Policy
        </label>
      )}
      {error && <p className="err">{error}</p>}
      <button className="primary" type="submit" disabled={busy}>
        {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}
      </button>
      {mode === "up" &&
        GROK_PROVIDERS.map((provider) => (
          <button key={provider.providerId} className="ghost" type="button" onClick={() => signIn(provider.providerId, { callbackURL: "/" })}>
            Continue with {provider.label}
          </button>
        ))}
      <button className="ghost" type="button" onClick={() => setMode(mode === "up" ? "in" : "welcome")}>
        {mode === "up" ? "I already have an account" : "Back"}
      </button>
    </form>
  );
}

function PricingPage({ onPlan }: { onPlan: (kind: string) => void }) {
  return (
    <div className="sheet">
      <h2>Pricing</h2>
      <article className="price-free">
        <span>Buyers</span>
        <strong>₦0</strong>
        <p>Buyers do not pay Aloko. Browse, save, message and collect giveaways for free. If you buy an item, you pay the seller directly. Aloko does not take that money.</p>
      </article>
      <p className="type-lead">Only sellers, businesses, decluttering services and advertisers pay Aloko. You pay on Paystack. The plan starts only after Paystack confirms the money. Buyers are never charged.</p>
      <article className="price-plan">
        <header>
          <span>Individual seller</span>
          <strong>₦0 to start</strong>
        </header>
        <ul>
          <li>3 listings free</li>
          <li>Each listing after that, ₦1,000</li>
          <li>Feature one listing for 7 days, ₦2,500</li>
        </ul>
        <button className="primary" type="button" onClick={() => onPlan("extra_listing")}>Buy one listing · ₦1,000</button>
      </article>
      <article className="price-plan">
        <header>
          <span>Business seller</span>
          <strong>₦12,000 / month</strong>
        </header>
        <ul>
          <li>Storefront and up to 100 products</li>
          <li>Feature a product for 7 days, ₦2,500</li>
          <li>Homepage placement for 7 days, ₦30,000</li>
        </ul>
        <button className="primary" type="button" onClick={() => onPlan("business_month")}>Start a business month · ₦12,000</button>
      </article>
      <article className="price-plan">
        <header>
          <span>Decluttering service</span>
          <strong>₦6,000 / month</strong>
        </header>
        <ul>
          <li>Service profile, areas and quote requests</li>
          <li>Promote the service for 7 days, ₦2,000</li>
        </ul>
        <button className="primary" type="button" onClick={() => onPlan("service_month")}>Start a service month · ₦6,000</button>
      </article>
      <article className="price-plan">
        <header>
          <span>Advertisers</span>
          <strong>From ₦15,000</strong>
        </header>
        <ul>
          <li>A category spot for 7 days, ₦15,000</li>
          <li>A homepage spot for 7 days, ₦30,000</li>
        </ul>
        <button className="ghost" type="button" onClick={() => onPlan("ad_category")}>Category spot · ₦15,000</button>
        <button className="ghost" type="button" onClick={() => onPlan("ad_home")}>Homepage spot · ₦30,000</button>
      </article>
    </div>
  );
}

export function AlokoApp() {
  const { user, isPending } = useCurrentUserState();
  const [tab, setTab] = useState<Tab>("home");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Nigeria");
  const [category, setCategory] = useState("All");
  const [kind, setKind] = useState<"all" | Kind>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [menu, setMenu] = useState(false);
  const [support, setSupport] = useState(false);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [liveServices, setLiveServices] = useState<{ id: string; title: string; areas: string; priceNote: string }[]>([]);
  const [liveAds, setLiveAds] = useState<{ id: string; slot: string; image: string }[]>([]);
  const [adSlot, setAdSlot] = useState<"ribbon_picks" | "ribbon_drops" | "ribbon_furniture" | "portrait" | null>(null);
  const [notes, setNotes] = useState<{ id: string; body: string; read: boolean }[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [follows, setFollows] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [mine, setMine] = useState<Listing[]>([]);
  const [live, setLive] = useState<Listing[]>([]);
  const [tapeAds, setTapeAds] = useState<{ id: string; body: string; seller: string }[]>([]);
  const [name, setName] = useState("Guest");
  const [accountType, setAccountType] = useState<AccountType>("buyer");
  const [serviceArea, setServiceArea] = useState("Lagos");
  const [threadOpen, setThreadOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    was: "",
    city: "Lagos",
    category: "Electronics",
    kind: "sale" as Kind,
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [photo, setPhoto] = useState("");
  const [desk, setDesk] = useState(false);
  const [pricing, setPricing] = useState(false);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [radiusKm, setRadiusKm] = useState(0);
  const [look, setLook] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [askNear, setAskNear] = useState(false);
  const [asMap, setAsMap] = useState(false);
  const [ready, setReady] = useState(false);
  const installEvent = useRef<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    const pay = new URLSearchParams(window.location.search).get("pay");
    if (pay !== "paid" && pay !== "failed") return;
    setToast(pay === "paid" ? "Paystack confirmed the payment." : "Paystack did not confirm that payment.");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      installEvent.current = event as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const installApp = async () => {
    const event = installEvent.current;
    if (event) {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        installEvent.current = null;
        setToast("Aloko is on your home screen.");
      }
      return;
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setToast(standalone ? "Aloko is already on this home screen." : "On iPhone, tap Share, then Add to Home Screen. Apple blocks a silent add.");
  };

  useEffect(() => {
    setSaved(loadSaved());
    setReady(true);
  }, []);

  useEffect(() => {
    let cancel = false;
    listLiveListings()
      .then((rows) => {
        if (!cancel) setLive(rows.map(fromRow));
      })
      .catch(() => {
        if (!cancel) setLive([]);
      });
    listTape()
      .then((rows) => {
        if (!cancel) setTapeAds(rows);
      })
      .catch(() => {
        if (!cancel) setTapeAds([]);
      });
    listHome()
      .then((rows) => {
        if (!cancel) setHomeSections(rows);
      })
      .catch(() => {
        if (!cancel) setHomeSections([]);
      });
    listLiveServices()
      .then((rows) => {
        if (!cancel) setLiveServices(rows);
      })
      .catch(() => {
        if (!cancel) setLiveServices([]);
      });
    listLiveAds()
      .then((rows) => {
        if (!cancel) setLiveAds(rows);
      })
      .catch(() => {
        if (!cancel) setLiveAds([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const reloadListings = () => {
    listLiveListings()
      .then((rows) => setLive(rows.map(fromRow)))
      .catch(() => {});
    listTape()
      .then((rows) => setTapeAds(rows))
      .catch(() => {});
    if (!user) {
      setDash(null);
      setMine([]);
      return;
    }
    getDashboard()
      .then((data) => {
        setDash(data);
        setAccountType(data.profile.accountType);
        setName(data.profile.displayName || user.displayName || "Guest");
        if (data.profile.serviceArea) setServiceArea(data.profile.serviceArea);
        setMine(data.listings.map(fromRow));
        setSaved(data.saves);
        setRadiusKm(data.profile.radiusKm);
        if (data.profile.lat != null && data.profile.lng != null) {
          setLook({ lat: data.profile.lat, lng: data.profile.lng, label: data.profile.area || data.profile.city || "Your area" });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    reloadListings();
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("aloko:saved", JSON.stringify(saved));
  }, [saved, ready]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const listings = useMemo(() => {
    const seen = new Set<string>();
    const next: Listing[] = [];
    for (const item of [...mine, ...live, ...SEED]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      next.push(item);
    }
    return next;
  }, [mine, live]);
  useEffect(() => {
    if (!user) {
      setNotes([]);
      setFollows([]);
      return;
    }
    touchSeen().catch(() => {});
    listNotes().then(setNotes).catch(() => setNotes([]));
    listFollows().then(setFollows).catch(() => setFollows([]));
  }, [user]);
  const staff = Boolean(dash?.profile.roles.includes("moderator") || dash?.profile.roles.includes("super_admin"));
  const canSell = Boolean(dash?.profile.roles.includes("individual") || dash?.profile.roles.includes("business"));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((item) => {
      if (savedOnly && !saved.includes(item.id)) return false;
      if (!isLive(item)) return false;
      if (item.paused || item.sold) return false;
      if (city !== "Nigeria" && item.state !== city && item.city !== city && !(STATE_CITIES[city] || []).includes(item.city)) return false;
      if (category !== "All" && item.category !== category) return false;
      if (kind !== "all" && item.kind !== kind) return false;
      if (!q) return true;
      return `${item.title} ${item.city} ${item.category} ${item.seller}`.toLowerCase().includes(q);
    });
  }, [listings, query, city, category, kind, savedOnly, saved]);

  const originLat = look?.lat;
  const originLng = look?.lng;
  const around = useMemo(() => {
    if (originLat == null || originLng == null) return [];
    const origin = { lat: originLat, lng: originLng };
    return listings
      .filter((item) => isLive(item) && !item.paused && !item.sold && item.kind === "sale" && item.lat != null && item.lng != null)
      .map((item) => ({ item, km: distanceKm(origin, { lat: item.lat as number, lng: item.lng as number }) }))
      .filter((row) => radiusKm === 0 || row.km <= radiusKm)
      .sort((a, b) => a.km - b.km)
      .slice(0, 8);
  }, [listings, originLat, originLng, radiusKm]);

  const tapeBits = useMemo(() => {
    const cuts = visible
      .filter((item) => cutOf(item.price, item.was) > 0)
      .map((item) => ({ id: item.id, text: `${item.seller} cut ${item.title}`, mark: `−${cutOf(item.price, item.was)}%` }));
    const ads = tapeAds.map((item) => ({ id: item.id, text: `${item.seller}: ${item.body}`, mark: "AD" }));
    return [...cuts, ...ads];
  }, [visible, tapeAds]);

  const toggleSaved = (id: string) => {
    if (!user) {
      setTab("account");
      setToast("Sign in to save a listing.");
      return;
    }
    void toggleSave({ data: id })
      .then((result) => {
        setSaved((old) => (result.saved ? [...old, id] : old.filter((item) => item !== id)));
        setToast(result.saved ? "Saved to your wishlist." : "Removed from saved.");
      })
      .catch(() => setToast("Could not save that listing."));
  };

  const openBuy = (nextKind: "all" | Kind = "all", nextCategory = category) => {
    setKind(nextKind);
    setCategory(nextCategory);
    setTab("buy");
    setMenu(false);
    setDesk(false); setPricing(false); setSupport(false);
    setSelected(null);
  };

  const useArea = () => {
    if (!navigator.geolocation) {
      setToast("This phone has no location. Choose a city instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const place = nearestPlace(pos.coords.latitude, pos.coords.longitude);
        setCity(place.city);
        setLook({ lat: place.lat, lng: place.lng, label: `${place.area}, ${place.city}` });
        setAskNear(false);
        setToast(`${place.area} only. Your exact spot is not saved.`);
      },
      () => setToast("Location was blocked. Choose a city instead."),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 },
    );
  };

  const decide = (id: string, status: "active" | "rejected") => {
    if (!user) {
      setTab("account");
      setToast("Sign in to review a listing.");
      return;
    }
    void decideListing({ data: { id, status } })
      .then(() => {
        setToast(status === "active" ? "Approved. It is on the home." : "Rejected. It stays off the home.");
        reloadListings();
      })
      .catch((err: unknown) => setToast(err instanceof Error ? err.message : "Could not review that listing."));
  };

  const publish = () => {
    const title = form.title.trim();
    const description = form.description.trim();
    const price = form.kind === "giveaway" ? 0 : Number(form.price);
    const was = form.kind === "giveaway" || form.was === "" ? undefined : Number(form.was);
    if (!user) {
      setTab("account");
      setToast("Sign in before listing an item.");
      return;
    }
    if (!photo) return setFormError("Add a photo. Listings need at least one picture.");
    if (title.length < 4) return setFormError("Give the item a title of at least 4 characters.");
    if (description.length < 10) return setFormError("Add a short description so buyers know the condition.");
    if (form.kind !== "giveaway" && (!Number.isFinite(price) || price < 1)) return setFormError("Enter a whole naira price.");
    if (was != null && (!Number.isFinite(was) || was <= price)) return setFormError("The price before must be higher than the price now.");
    void createListing({
      data: {
        title,
        description,
        price,
        was,
        city: form.city,
        category: form.category,
        kind: form.kind,
        image: photo,
        seller: name.trim() || user.displayName || "Aloko member",
      },
    })
      .then((created) => {
        setForm({ title: "", price: "", was: "", city: form.city, category: form.category, kind: "sale", description: "" });
        setPhoto("");
        setFormError("");
        setToast(`Sent for review as ${created.productCode}. It stays off the home until staff approve it.`);
        setTab("account");
        setDesk(false); setPricing(false);
        reloadListings();
      })
      .catch((err: unknown) => setFormError(err instanceof Error ? err.message : "Could not save the listing."));
  };

  return (
    <div className="aloko-stage">
      <div className="aloko-phone">
        <header className="aloko-header">
          <div className="brand-row">
            <button className="brand" type="button" onClick={() => { setTab("home"); setDesk(false); setPricing(false); setMenu(false); }}>
              <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
                <path d="M32 4c10 16 22 30 22 42a22 22 0 0 1-44 0C10 34 22 20 32 4Z" fill="#c6f135" />
                <path d="M32 16v22" stroke="#012115" strokeWidth="3" strokeLinecap="round" />
                <circle cx="32" cy="44" r="4.2" fill="#012115" />
              </svg>
              <span>
                <strong>Aloko</strong>
                <small>Sell it. Give it. Pass it on.</small>
              </span>
            </button>
            <div className="icon-row">
              <button className="round-btn" type="button" aria-label="Notifications" onClick={() => {
                if (!user) {
                  setToast("Sign in to follow a shop. The dot appears only when a shop you follow posts or sells.");
                  return;
                }
                setNotesOpen(true);
                if (notes.some((note) => !note.read)) {
                  markNotesRead().catch(() => {});
                  setNotes((old) => old.map((note) => ({ ...note, read: true })));
                }
              }}>
                <Icon name="bell" />
                {notes.some((note) => !note.read) && <i className="dot" />}
              </button>
              <button
                className={savedOnly ? "round-btn on" : "round-btn"}
                type="button"
                aria-label="Saved listings"
                aria-pressed={savedOnly}
                onClick={() => {
                  setSavedOnly((v) => !v);
                  setTab("home");
                  setToast(savedOnly ? "Showing all listings." : "Showing saved only.");
                }}
              >
                <Icon name="heart" />
              </button>
              <button className="round-btn" type="button" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                <Icon name="menu" />
              </button>
            </div>
          </div>
          <div className="search-row">
            <label className="loc-pill">
              <span className="pin-ico">
                <Icon name="pin" />
              </span>
              <select aria-label="Location" value={city} onChange={(e) => setCity(e.target.value)}>
                <option>Nigeria</option>
                {STATES.map((place) => (
                  <option key={place}>{place}</option>
                ))}
              </select>
              <span className="chev">⌄</span>
            </label>
            <div className="search-pill">
              <span className="search-ico">
                <Icon name="search" />
              </span>
              <input
                suppressHydrationWarning
                aria-label="Search listings"
                placeholder="Search for items, services."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="cam-btn" type="button" aria-label="Camera search" onClick={() => setToast("Photo search isn’t connected yet.")}>
                <Icon name="camera" />
              </button>
            </div>
          </div>
          {menu && (
            <div className="menu-panel" role="menu">
              {!user && <button className="menu-signin" type="button" onClick={() => { setTab("account"); setSupport(false); setDesk(false); setPricing(false); setMenu(false); }}>Sign up / Log in</button>}
              <button type="button" onClick={() => { setTab("home"); setSavedOnly(false); setDesk(false); setPricing(false); setSupport(false); setMenu(false); }}>Home</button>
              <button type="button" onClick={() => { setSavedOnly(true); setTab("buy"); setDesk(false); setPricing(false); setSupport(false); setMenu(false); }}>Saved ({saved.length})</button>
              <button type="button" onClick={() => { setTab("sell"); setDesk(false); setPricing(false); setSupport(false); setMenu(false); }}>Start selling</button>
              <button type="button" onClick={() => openBuy("giveaway")}>Pass it on</button>
              <button type="button" onClick={() => openBuy("all", "All")}>Browse</button>
              <button type="button" onClick={() => { setPricing(true); setDesk(false); setSupport(false); setMenu(false); }}>Pricing</button>
              {staff && <button type="button" onClick={() => { setDesk(true); setPricing(false); setSupport(false); setMenu(false); }}>Review queue</button>}
              <button type="button" onClick={() => { setTab("account"); setDesk(false); setPricing(false); setSupport(false); setMenu(false); }}>Account</button>
              <button className="menu-support" type="button" onClick={() => { setSupport(true); setDesk(false); setPricing(false); setMenu(false); }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M6 19c1-3 3.2-4.5 6-4.5S17 16 18 19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M4 12a2 2 0 0 1 2-2v5a2 2 0 0 1-2-2zM20 12a2 2 0 0 0-2-2v5a2 2 0 0 0 2-2z" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
                Contact support
              </button>
            </div>
          )}
        </header>

        <main className="aloko-main">
          {support ? (
            <SupportDesk email={user?.primaryEmail ?? ""} name={user?.displayName ?? ""} />
          ) : pricing ? (
            <PricingPage onPlan={(kind) => {
              if (!user) {
                setPricing(false);
                setTab("account");
                setToast("Sign in first. Buyers are not charged.");
                return;
              }
              void startCheckout({ data: { kind } })
                .then((result) => { window.location.assign(result.authorizationUrl); })
                .catch((err: unknown) => setToast(err instanceof Error ? err.message : "Paystack did not open."));
            }} />
          ) : desk ? (
            <div className="sheet">
              <h2>Review queue</h2>
              <p className="type-lead">A listing stays off the home until it is approved.</p>
              { (dash?.queue.length ?? 0) === 0 ? (
                <p className="empty">Nothing is waiting. New listings land here after a photo is submitted.</p>
              ) : (
                <div className="queue">
                  {(dash?.queue ?? []).map((item) => (
                      <article key={item.id} className="queue-card">
                        <img src={item.image} alt="" />
                        <div>
                          <strong>{item.title}</strong>
                          <span>
                            {naira(item.price)} · {item.city} · {item.seller}
                          </span>
                          <div className="queue-actions">
                            <button className="primary" type="button" onClick={() => decide(item.id, "active")}>
                              Approve
                            </button>
                            <button className="ghost" type="button" onClick={() => decide(item.id, "rejected")}>
                              Reject
                            </button>
                          </div>
                        </div>
                      </article>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "home" && (
            <HomeFeed
              items={visible}
              saved={saved}
              around={around}
              onOpen={(id) => {
                const item = visible.find((row) => row.id === id);
                if (item) setSelected(item);
              }}
              onSave={toggleSaved}
              onBrowse={openBuy}
              onSell={() => setTab("sell")}
              onNear={() => {
                if (!user) {
                  setTab("account");
                  setToast("Sign in to use nearby.");
                  return;
                }
                setAskNear(true);
                setTab("buy");
              }}
              onClearout={() => setToast("Decluttering bookings open with a seller message.")}
              onInstall={() => void installApp()}
              onPricing={() => { setPricing(true); setDesk(false); }}
              onAccount={() => setTab("account")}
              tape={tapeBits}
              sections={homeSections.filter((section) => section.enabled).map((section) => ({ id: section.id, title: section.title }))}
              services={liveServices}
              ads={liveAds}
              onService={(service) => {
                setSupport(true);
                setToast(`Ask about ${service.title}. Write it in support and Aloko keeps the ticket.`);
              }}
              onAdvertise={(slot) => {
                if (!user) {
                  setTab("account");
                  setToast("Sign in to book a banner. Buyers are not charged for shopping.");
                  return;
                }
                setAdSlot(slot);
              }}
            />
          )}

          {!desk && tab === "buy" && (
            <div className="sheet">
              <h2>{kind === "giveaway" ? "Giveaways" : kind === "bulk" ? "Bulk deals" : category === "All" ? "Browse listings" : category}</h2>
              {user ? (
                <div className="seg">
                  <button className={asMap ? "seg-btn" : "seg-btn on"} type="button" onClick={() => setAsMap(false)}>List</button>
                  <button className={asMap ? "seg-btn on" : "seg-btn"} type="button" onClick={() => setAsMap(true)}>Map</button>
                  <button className="seg-btn" type="button" onClick={() => setAskNear(true)}>Near me</button>
                  <select className="near-select" aria-label="Distance" value={radiusKm} onChange={(event) => {
                    const next = Number(event.target.value);
                    setRadiusKm(next);
                    void saveRadius({ data: next }).catch(() => setToast("That distance did not save."));
                  }}>
                    <option value={0}>Anywhere</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                  </select>
                </div>
              ) : (
                <p className="type-lead">Sign in to use the map and nearby. Anyone can still browse the list.</p>
              )}
              {user && askNear && (
                <div className="form">
                  <p className="type-lead">Aloko uses this once to pick your nearest area. Your precise location is not saved, and it is never shown to sellers.</p>
                  <div className="seg">
                    <button className="seg-btn on" type="button" onClick={useArea}>Allow</button>
                    <button className="seg-btn" type="button" onClick={() => setAskNear(false)}>Not now</button>
                  </div>
                </div>
              )}
              {visible.length === 0 ? (
                <p className="empty">No listings in this filter. Change city, category, or search.</p>
              ) : user && asMap ? (
                <ListingMap
                  you={originLat != null && originLng != null ? { lat: originLat, lng: originLng } : null}
                  onOpen={(id) => {
                    const item = visible.find((row) => row.id === id);
                    if (item) setSelected(item);
                  }}
                  pins={visible
                    .filter((item) => item.lat != null && item.lng != null)
                    .filter((item) => {
                      if (!radiusKm || originLat == null || originLng == null || item.lat == null || item.lng == null) return true;
                      return distanceKm({ lat: originLat, lng: originLng }, { lat: item.lat, lng: item.lng }) <= radiusKm;
                    })
                    .map((item) => ({
                      id: item.id,
                      title: item.title,
                      price: naira(item.price),
                      lat: item.lat as number,
                      lng: item.lng as number,
                      label: item.area || item.city,
                    }))}
                />
              ) : (
                <div className="grid-2">
                  {visible
                    .filter((item) => {
                      if (!radiusKm || originLat == null || originLng == null || item.lat == null || item.lng == null) return true;
                      return distanceKm({ lat: originLat, lng: originLng }, { lat: item.lat, lng: item.lng }) <= radiusKm;
                    })
                    .sort((a, b) => {
                      if (originLat == null || originLng == null || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return 0;
                      const origin = { lat: originLat, lng: originLng };
                      return distanceKm(origin, { lat: a.lat, lng: a.lng }) - distanceKm(origin, { lat: b.lat, lng: b.lng });
                    })
                    .map((item) => {
                      const km = originLat != null && originLng != null && item.lat != null && item.lng != null
                        ? distanceKm({ lat: originLat, lng: originLng }, { lat: item.lat, lng: item.lng })
                        : null;
                      const place = item.area ? `${item.area}, ${item.city}` : item.city;
                      return (
                    <button key={item.id} className="grid-card" type="button" onClick={() => setSelected(item)}>
                      <img src={item.image} alt="" />
                      <div className="listing-copy">
                        <strong>{item.title}</strong>
                        <PriceLine price={item.price} was={item.was} />
                        <span className="cond">{item.condition}</span>
                        <span className="place">
                          <Icon name="pin" />
                          {place}{km != null ? ` · ~${km} km` : ""}
                        </span>
                      </div>
                      {item.verified && <span className="verified" title="Aloko verified this business">✓</span>}
                    </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {!desk && tab === "sell" && (
            <div className="sheet">
              <h2>Start selling</h2>
              <p className="empty" style={{ padding: "0 0 8px" }}>
                Sign in, add a photo, then send it for review. It stays off the home until Aloko staff approve it.
              </p>
              {isPending ? (
                <p className="auth-note">Checking your account…</p>
              ) : !user ? (
                <SignInPanel onDone={() => setToast("Signed in.")} />
              ) : !canSell ? (
                <div className="form">
                  <p className="auth-note">Buying is free. Listing needs Individual Seller or Business Seller on this same account.</p>
                  <button className="primary" type="button" onClick={() => { void activateRole({ data: "individual" }).then(() => { reloadListings(); setToast("Individual Seller is on."); }).catch((err: unknown) => setToast(err instanceof Error ? err.message : "Could not add that role.")); }}>Join as Individual Seller</button>
                  <button className="ghost" type="button" onClick={() => { void activateRole({ data: "business" }).then(() => { reloadListings(); setToast("Business Seller is on."); }).catch((err: unknown) => setToast(err instanceof Error ? err.message : "Could not add that role.")); }}>Join as Business Seller</button>
                </div>
              ) : (
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  publish();
                }}
              >
                <label className="photo-field">
                  Photo
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="Listing photo"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        setFormError("Use a photo, not another file.");
                        return;
                      }
                      readPhoto(file)
                        .then((src) => {
                          setPhoto(src);
                          setFormError("");
                        })
                        .catch(() => setFormError("That photo could not be read. Try another."));
                    }}
                  />
                  {photo ? <img src={photo} alt="" /> : <span>Add one clear photo of the item.</span>}
                </label>
                <label>
                  Title
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="iPhone 14 Pro" />
                </label>
                <label>
                  Type
                  <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}>
                    <option value="sale">For sale</option>
                    <option value="giveaway">Give away for free</option>
                    <option value="bulk">Bulk / clear-out</option>
                  </select>
                </label>
                {form.kind !== "giveaway" && (
                  <>
                    <label>
                      Price in naira
                      <input inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d]/g, "") })} placeholder="520000" />
                    </label>
                    <label>
                      Price before this cut
                      <input inputMode="numeric" value={form.was} onChange={(e) => setForm({ ...form, was: e.target.value.replace(/[^\d]/g, "") })} placeholder="Leave blank if the price did not drop" />
                    </label>
                  </>
                )}
                <label>
                  City
                  <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    {CITIES.map((place) => (
                      <option key={place}>{place}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Category
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((item) => (
                      <option key={item.id}>{item.id}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Description
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Condition, what’s included, pickup area." />
                </label>
                {formError && <p className="err">{formError}</p>}
                <button className="primary" type="submit">
                  Publish listing
                </button>
              </form>
              )}
            </div>
          )}

          {!desk && tab === "messages" && (
            !user ? (
              <div className="sheet">
                <h2>Messages</h2>
                <p className="type-lead">Sign in to message a seller about a product.</p>
              </div>
            ) : (
              <ChatDesk threads={dash?.threads ?? []} wallpaper={dash?.profile.wallpaper ?? "mint"} onRefresh={reloadListings} onError={(message) => setToast(message)} />
            )
          )}

          {!desk && tab === "account" && (
            isPending ? (
              <div className="sheet"><p className="auth-note">Checking your account…</p></div>
            ) : !user || !dash ? (
              <SignInPanel onDone={() => setToast("Signed in. Choose how you use Aloko.")} />
            ) : !dash.profile.onboarded ? (
              <Onboarding
                onDone={(role) => {
                  reloadListings();
                  setToast("You're in.");
                  setTab(role === "buyer" ? "home" : "account");
                }}
                onError={(message) => setToast(message)}
              />
            ) : (
              <Workspace
                data={dash}
                onRefresh={reloadListings}
                onSell={() => { setTab("sell"); setDesk(false); setPricing(false); }}
                onDiscover={() => openBuy("all", "All")}
                onGiveaways={() => openBuy("giveaway")}
                onError={(message) => setToast(message)}
                home={homeSections}
                onHome={(id, change) => {
                  void setHomeSection({ data: { id, ...change } })
                    .then(() => listHome().then(setHomeSections))
                    .catch((err: unknown) => setToast(err instanceof Error ? err.message : "Could not update the home."));
                }}
              />
            )
          )}

        </main>

        <div className="dock">
        <nav className="nav-tabs" aria-label="App">
          {(
            [
              ["home", "Home", "home"],
              ["buy", "Buy", "bag"],
              ["sell", "Sell", "plus"],
              ["messages", "Messages", "chat"],
              ["account", "Account", "user"],
            ] as const
          ).map(([id, label, icon]) => (
            <button key={id} className={tab === id && !desk && !pricing ? "tab on" : "tab"} type="button" onClick={() => { setTab(id); setDesk(false); setPricing(false); setMenu(false); }}>
              <Icon name={icon} />
              <small>{label}</small>
              {id === "messages" && <i className="msg-dot" />}
            </button>
          ))}
        </nav>
        </div>

        {selected && (
          <div className="detail" role="dialog" aria-modal="true" aria-label={selected.title}>
            <div className="detail-card">
              <button className="linkish" type="button" onClick={() => setSelected(null)}>
                ← Back
              </button>
              <img src={selected.image} alt="" />
              <h3>{selected.title}</h3>
              <div className="seller-line">
                <span className="avatar">{selected.seller.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{selected.seller}{selected.verified ? " · Verified business" : ""}</strong>
                  <small>
                    {selected.postedAt ? `Posted ${new Date(selected.postedAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : "Sample listing"}
                    {selected.sellerId ? <span className={selected.sellerOnline ? "on-dot" : ""}> · {selected.sellerOnline ? "Online" : "Offline"}</span> : ""}
                  </small>
                </div>
                {selected.sellerId && user && (
                  <button className="ghost" type="button" onClick={() => {
                    void toggleFollow({ data: selected.sellerId! })
                      .then((result) => setFollows((old) => result.following ? [...old, selected.sellerId!] : old.filter((id) => id !== selected.sellerId)))
                      .catch((err: unknown) => setToast(err instanceof Error ? err.message : "Could not follow that shop."));
                  }}>{follows.includes(selected.sellerId) ? "Following" : "Follow"}</button>
                )}
              </div>
              {selected.productCode && <p className="type-lead">{selected.productCode}</p>}
              <div className="price-lg"><PriceLine price={selected.price} was={selected.was} /></div>
              <p className="place">
                <Icon name="pin" />
                {selected.area ? `${selected.area}, ${selected.city}` : selected.city}
                {selected.state && selected.state !== selected.city ? `, ${selected.state}` : ""} · {selected.condition} · {selected.seller}
                {selected.verified ? " · Aloko verified this business" : ""}
              </p>
              {originLat != null && originLng != null && selected.lat != null && selected.lng != null && (
                <p className="type-lead">About {distanceKm({ lat: originLat, lng: originLng }, { lat: selected.lat, lng: selected.lng })} km from your area. Distances are area to area, not a street measurement.</p>
              )}
              <p className="type-lead">{reach(selected.coverage)}. The exact pickup point is shared only in chat.</p>
              <p>{selected.description}</p>
              <div className="detail-actions">
                <button className="ghost" type="button" onClick={() => toggleSaved(selected.id)}>
                  {saved.includes(selected.id) ? "Saved" : "Save"}
                </button>
                <button
                  className="primary"
                  type="button"
                  style={{ flex: 1 }}
                  onClick={() => {
                    if (!selected.productCode) {
                      setToast("Sample listings do not have a seller inbox.");
                      return;
                    }
                    if (!user) {
                      setSelected(null);
                      setTab("account");
                      setToast("Sign in to message the seller.");
                      return;
                    }
                    const code = selected.productCode;
                    const id = selected.id;
                    void openThread({ data: { listingId: id, body: `Is ${code} still available?` } })
                      .then(() => {
                        setSelected(null);
                        setTab("messages");
                        reloadListings();
                        setToast(`Message sent about ${code}.`);
                      })
                      .catch((err: unknown) => setToast(err instanceof Error ? err.message : "Could not send that message."));
                  }}
                >
                  Message seller
                </button>
              </div>
            </div>
          </div>
        )}

        {notesOpen && (
          <div className="detail" role="dialog" aria-modal="true" aria-label="Notifications">
            <div className="detail-card">
              <button className="linkish" type="button" onClick={() => setNotesOpen(false)}>← Back</button>
              <h3>Notifications</h3>
              <p className="type-lead">Only a shop you follow. A new listing, or a sale.</p>
              <div className="note-list">
                {notes.length === 0 ? <p>Nothing yet. Follow a shop from a listing.</p> : notes.map((note) => <p key={note.id}>{note.body}</p>)}
              </div>
            </div>
          </div>
        )}
        {adSlot && (
          <AdBook
            slot={adSlot}
            onClose={() => setAdSlot(null)}
            onError={(message) => setToast(message)}
          />
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

function AdBook({
  slot,
  onClose,
  onError,
}: {
  slot: "ribbon_picks" | "ribbon_drops" | "ribbon_furniture" | "portrait";
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const names: Record<typeof slot, string> = {
    ribbon_picks: "This week’s picks",
    ribbon_drops: "Price drops",
    ribbon_furniture: "Furniture around you",
    portrait: "Portrait, before the footer",
  };
  const [step, setStep] = useState<"place" | "art" | "pay" | "full">("place");
  const [slots, setSlots] = useState<{ slot: typeof slot; capacity: number; left: number }[]>([]);
  const [picked, setPicked] = useState(slot);
  const [holdId, setHoldId] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen = slots.find((row) => row.slot === picked);
  const portrait = picked === "portrait";
  const price = portrait ? "₦40,000" : "₦15,000";

  useEffect(() => {
    listAdSlots()
      .then((rows) => {
        setSlots(rows as { slot: typeof slot; capacity: number; left: number }[]);
        const mine = rows.find((row) => row.slot === slot);
        if (mine && mine.left === 0) setStep("full");
      })
      .catch((err: unknown) => onError(err instanceof Error ? err.message : "Could not load the slots."));
  }, [slot]);

  const read = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        const max = portrait ? 900 : 1200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };

  const hold = () => {
    if (!chosen || chosen.left === 0) {
      setStep("full");
      return;
    }
    setBusy(true);
    void reserveAd({ data: picked })
      .then((held) => {
        setHoldId(held.id);
        setStep("art");
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "No Ads Slot Left";
        if (message.includes("No Ads Slot Left")) setStep("full");
        else onError(message);
      })
      .finally(() => setBusy(false));
  };

  const pay = () => {
    if (!holdId || !image) return;
    setBusy(true);
    void submitAd({ data: { id: holdId, image } })
      .then((created) => startCheckout({ data: { orderId: created.orderId } }))
      .then((result) => { window.location.assign(result.authorizationUrl); })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "No Ads Slot Left";
        if (message.includes("No Ads Slot Left")) setStep("full");
        else onError(message);
        setBusy(false);
      });
  };

  return (
    <div className="detail" role="dialog" aria-modal="true" aria-label="Book a banner">
      <div className="detail-card form">
        <button className="linkish" type="button" onClick={onClose}>← Back</button>
        <p className="ad-steps">{step === "place" || step === "full" ? "1 · Placement" : step === "art" ? "2 · Artwork" : "3 · Payment"}</p>
        {step === "full" ? (
          <>
            <h3>No Ads Slot Left</h3>
            <p className="type-lead">This placement is booked for the week. Payment does not open when there is no space.</p>
            <button className="ghost" type="button" onClick={onClose}>Close</button>
          </>
        ) : step === "place" ? (
          <>
            <h3>Choose a placement</h3>
            <p className="type-lead">A space is held for 20 minutes once you continue. The price is on the payment screen.</p>
            <div className="ad-slots">
              {slots.map((row) => (
                <button key={row.slot} className={picked === row.slot ? "ad-slot on" : "ad-slot"} type="button" onClick={() => setPicked(row.slot)}>
                  <strong>{names[row.slot]}</strong>
                  <span>{row.left === 0 ? "No Ads Slot Left" : `${row.left} slot left`}</span>
                </button>
              ))}
            </div>
            {chosen && chosen.left === 0 ? (
              <p className="err">No Ads Slot Left</p>
            ) : (
              <button className="primary" type="button" disabled={busy || !chosen} onClick={hold}>{busy ? "Holding the slot…" : "Continue"}</button>
            )}
          </>
        ) : step === "art" ? (
          <>
            <h3>Add the artwork</h3>
            <p className="type-lead">{names[picked]}. {chosen ? `${chosen.left} slot left before this hold.` : ""}</p>
            <label>
              Banner photo
              <input type="file" accept="image/*" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) read(file);
              }} />
            </label>
            {image && <img src={image} alt="" />}
            <div className="detail-actions">
              <button className="ghost" type="button" onClick={() => setStep("place")}>Back</button>
              <button className="primary" type="button" disabled={!image} onClick={() => setStep("pay")}>Continue</button>
            </div>
          </>
        ) : (
          <>
            <h3>Pay for the week</h3>
            <p className="type-lead">{names[picked]} · {price}. Paystack confirms the money, then the banner goes up. A super admin does not have to place it.</p>
            {image && <img src={image} alt="" />}
            <div className="detail-actions">
              <button className="ghost" type="button" onClick={() => setStep("art")}>Back</button>
              <button className="primary" type="button" disabled={busy} onClick={pay}>{busy ? "Opening Paystack…" : "Pay with Paystack"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SupportDesk({ email, name }: { email: string; name: string }) {
  const [mail, setMail] = useState(email);
  const [who, setWho] = useState(name);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [ticket, setTicket] = useState<TicketView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("aloko-ticket");
    if (!id) return;
    readTicket({ data: id }).then(setTicket).catch(() => localStorage.removeItem("aloko-ticket"));
  }, []);

  const send = (live: boolean) => {
    const nextBody = body.trim() || (live ? "I need to speak with someone at Aloko." : "");
    void openTicket({
      data: {
        email: mail,
        name: who || "Aloko member",
        subject: (live && subject.trim().length < 3 ? "Live support" : subject).trim(),
        body: nextBody,
      },
    })
      .then((created) => {
        localStorage.setItem("aloko-ticket", created.id);
        return readTicket({ data: created.id });
      })
      .then((next) => {
        setTicket(next);
        setError("");
        setBody("");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not open that ticket."));
  };

  const follow = () => {
    if (!ticket) return;
    void addTicketNote({ data: { id: ticket.id, email: ticket.email, body: note } })
      .then(() => readTicket({ data: ticket.id }))
      .then((next) => {
        setTicket(next);
        setNote("");
        setError("");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not send that."));
  };

  return (
    <div className="sheet support-desk form">
      <h2>Contact support</h2>
      <p className="type-lead">A person at Aloko reads this. It is not an automated reply. The ticket stays on your account email.</p>
      {ticket ? (
        <>
          <p className="type-lead">{ticket.subject} · {ticket.status}</p>
          {ticket.messages.map((message) => (
            <p key={message.id} className={message.sender === "staff" ? "support-note staff" : "support-note"}>{message.body}</p>
          ))}
          <label>Reply<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add to this ticket" /></label>
          <button className="primary" type="button" onClick={follow}>Send</button>
        </>
      ) : (
        <>
          <label>Name<input value={who} onChange={(event) => setWho(event.target.value)} /></label>
          <label>Email<input value={mail} onChange={(event) => setMail(event.target.value)} inputMode="email" placeholder="you@email.com" /></label>
          <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="A listing, a payment, an account" /></label>
          <label>Message<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tell us what happened." /></label>
          <div className="detail-actions">
            <button className="primary" type="button" onClick={() => send(false)}>Send ticket</button>
            <button className="ghost" type="button" onClick={() => send(true)}>Live support</button>
          </div>
        </>
      )}
      {error && <p className="err">{error}</p>}
    </div>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { placeFor } from "@/lib/places";

const ALL_ROLES = ["buyer", "individual", "business", "service", "moderator", "super_admin"] as const;
const PUBLIC_ROLES = ["buyer", "individual", "business", "service"] as const;
const OWNERS = new Set(["officialtruegliterz@gmail.com"]);
const KINDS = ["sale", "giveaway", "bulk"] as const;
const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Benin City", "Kano"];
const CATEGORIES = ["Electronics", "Furniture", "Fashion", "Home & Living", "Sports"];
const PREFIX: Record<string, string> = {
  Electronics: "ELE",
  Furniture: "FUR",
  Fashion: "FAS",
  "Home & Living": "HOM",
  Sports: "SPO",
};

export type AlokoRole = (typeof ALL_ROLES)[number];
export type AlokoKind = (typeof KINDS)[number];

export type AlokoProfile = {
  displayName: string;
  accountType: AlokoRole;
  roles: AlokoRole[];
  serviceArea: string;
  businessName: string;
  city: string;
  interests: string;
  verification: string;
  cacRef: string;
  suspended: boolean;
  email: string;
  onboarded: boolean;
  wallpaper: string;
  state: string;
  area: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  coverage: string;
  planUntil: string | null;
};

export type AlokoRow = {
  id: string;
  title: string;
  price: number;
  city: string;
  category: string;
  kind: AlokoKind;
  image: string;
  seller: string;
  description: string;
  status: "pending" | "active" | "rejected";
  productCode: string;
  paused: boolean;
  sold: boolean;
  stock: number;
  soldPrice: number | null;
  buyerName: string;
  negotiated: boolean;
  soldAt: string | null;
  area: string;
  state: string;
  lat: number | null;
  lng: number | null;
  coverage: string;
  featured: boolean;
  was: number | null;
  verified: boolean;
};

export type ServiceRow = {
  id: string;
  title: string;
  description: string;
  areas: string;
  priceNote: string;
  status: "pending" | "active" | "rejected";
};

export type ThreadRow = {
  id: string;
  productCode: string;
  listingTitle: string;
  lastBody: string;
  listingId: string;
  asking: number;
  soldPrice: number | null;
  soldAt: string | null;
  negotiated: boolean;
  buyerName: string;
  city: string;
};
export type PersonRow = {
  id: string;
  name: string;
  email: string;
  roles: AlokoRole[];
  suspended: boolean;
  verification: string;
  businessName: string;
};
export type AuditRow = { id: string; action: string; target: string };
export type OrderRow = { id: string; kind: string; amount: number; status: string; listingId: string; email?: string };
export type TapeRow = { id: string; body: string; status: string; kind: string; seller?: string };
export type DashboardData = {
  profile: AlokoProfile;
  listings: AlokoRow[];
  services: ServiceRow[];
  threads: ThreadRow[];
  queue: AlokoRow[];
  serviceQueue: ServiceRow[];
  people: PersonRow[];
  audit: AuditRow[];
  saves: string[];
  recent: { id: string; title: string }[];
  creditsLeft: number;
  orders: OrderRow[];
  deals: { id: string; title: string; soldPrice: number | null; city: string; soldAt: string | null }[];
  waitingOrders: OrderRow[];
  tape: TapeRow[];
  tapeQueue: TapeRow[];
  tapeFree: number;
};

type Sql = Awaited<ReturnType<typeof getSql>>;
type ListingSql = {
  id: string;
  title: string;
  price_naira: number;
  city: string;
  category: string;
  kind: string;
  image: string;
  seller_name: string;
  description: string;
  status: string;
  product_code: string;
  paused: boolean;
  sold_at: string | null;
  stock: number;
  sold_price: number | null;
  buyer_name: string;
  negotiated: boolean;
  area: string;
  state: string;
  lat: number | null;
  lng: number | null;
  coverage: string;
  featured_until: string | null;
  was_naira: number | null;
  business_verified: boolean;
};

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}
function asRole(value: string): AlokoRole {
  return (ALL_ROLES as readonly string[]).includes(value) ? (value as AlokoRole) : "buyer";
}
function asKind(value: string): AlokoKind {
  return value === "giveaway" || value === "bulk" ? value : "sale";
}
function asStatus(value: string): "pending" | "active" | "rejected" {
  return value === "active" || value === "rejected" ? value : "pending";
}
function toRow(row: ListingSql): AlokoRow {
  return {
    id: row.id,
    title: row.title,
    price: row.price_naira,
    city: row.city,
    category: row.category,
    kind: asKind(row.kind),
    image: row.image,
    seller: row.seller_name,
    description: row.description,
    status: asStatus(row.status),
    productCode: row.product_code,
    paused: Boolean(row.paused),
    sold: Boolean(row.sold_at),
    stock: row.stock || 1,
    soldPrice: row.sold_price,
    buyerName: row.buyer_name ?? "",
    negotiated: Boolean(row.negotiated),
    soldAt: row.sold_at,
    area: row.area ?? "",
    state: row.state ?? "",
    lat: row.lat,
    lng: row.lng,
    coverage: row.coverage || "city",
    featured: Boolean(row.featured_until && new Date(row.featured_until).getTime() > Date.now()),
    was: row.was_naira && row.was_naira > row.price_naira ? row.was_naira : null,
    verified: Boolean(row.business_verified),
  };
}

async function emailOf(sql: Sql, userId: string) {
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId}`;
  return (rows[0]?.email ?? "").toLowerCase();
}

async function rolesOf(sql: Sql, userId: string) {
  const email = await emailOf(sql, userId);
  await sql`insert into aloko_memberships (user_id, role) values (${userId}, 'buyer') on conflict do nothing`;
  if (OWNERS.has(email)) {
    await sql`insert into aloko_memberships (user_id, role) values (${userId}, 'super_admin') on conflict do nothing`;
  }
  const rows = await sql<{ role: string }>`select role from aloko_memberships where user_id = ${userId}`;
  return Array.from(new Set(rows.map((row) => asRole(row.role))));
}

function isStaff(roles: AlokoRole[]) {
  return roles.includes("moderator") || roles.includes("super_admin");
}

async function assertLive(sql: Sql, userId: string) {
  const rows = await sql<{ suspended: boolean }>`select suspended from aloko_profiles where user_id = ${userId}`;
  if (rows[0]?.suspended) throw new Error("This account is suspended.");
}

async function audit(sql: Sql, actorId: string, action: string, target: string) {
  await sql`insert into aloko_audit (id, actor_id, action, target) values (${crypto.randomUUID()}, ${actorId}, ${action}, ${target})`;
}

async function profileOf(sql: Sql, userId: string): Promise<AlokoProfile> {
  const roles = await rolesOf(sql, userId);
  const email = await emailOf(sql, userId);
  const rows = await sql<{
    display_name: string;
    account_type: string;
    service_area: string;
    business_name: string;
    city: string;
    interests: string;
    verification: string;
    cac_ref: string;
    suspended: boolean;
    onboarded: boolean;
    wallpaper: string;
    state: string;
    area: string;
    lat: number | null;
    lng: number | null;
    radius_km: number;
    coverage: string;
    plan_until: string | null;
  }>`
    select display_name, account_type, service_area, business_name, city, interests, verification, cac_ref, suspended, onboarded, wallpaper, state, area, lat, lng, radius_km, coverage, plan_until
    from aloko_profiles where user_id = ${userId}
  `;
  const row = rows[0];
  const active = row && roles.includes(asRole(row.account_type)) ? asRole(row.account_type) : "buyer";
  if (!row) {
    await sql`
      insert into aloko_profiles (user_id, display_name, account_type)
      values (${userId}, '', 'buyer')
      on conflict (user_id) do nothing
    `;
  }
  return {
    displayName: row?.display_name ?? "",
    accountType: active,
    roles,
    serviceArea: row?.service_area ?? "",
    businessName: row?.business_name ?? "",
    city: row?.city ?? "",
    interests: row?.interests ?? "",
    verification: row?.verification ?? "none",
    cacRef: row?.cac_ref ?? "",
    suspended: Boolean(row?.suspended),
    email,
    onboarded: Boolean(row?.onboarded),
    wallpaper: row?.wallpaper || "mint",
    state: row?.state ?? "",
    area: row?.area ?? "",
    lat: row?.lat ?? null,
    lng: row?.lng ?? null,
    radiusKm: row?.radius_km ?? 0,
    coverage: row?.coverage || "city",
    planUntil: row?.plan_until ?? null,
  };
}

const PRICES = {
  extra_listing: 1000,
  feature_listing: 2500,
  business_month: 12000,
  service_month: 6000,
  ad_category: 15000,
  ad_home: 30000,
  tape_line: 5000,
} as const;

async function paidExtras(sql: Sql, userId: string) {
  const rows = await sql<{ n: number }>`select count(*)::int as n from aloko_orders where user_id = ${userId} and kind = 'extra_listing' and status = 'paid'`;
  return rows[0]?.n ?? 0;
}

async function allowance(sql: Sql, userId: string, roles: AlokoRole[], used: number) {
  const profile = await profileOf(sql, userId);
  const planOn = Boolean(profile.planUntil && new Date(profile.planUntil).getTime() > Date.now());
  if (roles.includes("business") && planOn) return Math.max(0, 100 - used);
  if (roles.includes("business")) return Math.max(0, 20 - used);
  return Math.max(0, 3 + (await paidExtras(sql, userId)) - used);
}

export const listLiveListings = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<ListingSql>`
    select id, title, price_naira, city, category, kind, image, seller_name, description, status, product_code, paused, sold_at, stock, sold_price, buyer_name, negotiated, area, state, lat, lng, coverage, featured_until, was_naira,
      coalesce((select verification = 'approved' and account_type = 'business' from aloko_profiles where user_id = aloko_listings.user_id), false) as business_verified
    from aloko_listings
    where status = 'active' and paused = false and sold_at is null
    order by created_at desc
    limit 40
  `;
  return rows.map(toRow);
});

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DashboardData> => {
    const sql = await getSql();
    const profile = await profileOf(sql, context.userId);
    const listings = (
      await sql<ListingSql>`
        select id, title, price_naira, city, category, kind, image, seller_name, description, status, product_code, paused, sold_at, stock, sold_price, buyer_name, negotiated, area, state, lat, lng, coverage, featured_until, was_naira,
      coalesce((select verification = 'approved' and account_type = 'business' from aloko_profiles where user_id = aloko_listings.user_id), false) as business_verified
        from aloko_listings where user_id = ${context.userId} order by created_at desc limit 40
      `
    ).map(toRow);
    const services = (
      await sql<{ id: string; title: string; description: string; areas: string; price_note: string; status: string }>`
        select id, title, description, areas, price_note, status from aloko_services
        where user_id = ${context.userId} order by created_at desc limit 20
      `
    ).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      areas: row.areas,
      priceNote: row.price_note,
      status: asStatus(row.status),
    }));
    const threads = await sql<ThreadRow>`
      select t.id, t.product_code as "productCode", coalesce(l.title, t.product_code) as "listingTitle",
        coalesce((select body from aloko_messages m where m.thread_id = t.id order by m.created_at desc limit 1), '') as "lastBody",
        t.listing_id as "listingId",
        coalesce(l.price_naira, 0) as asking,
        l.sold_price as "soldPrice",
        l.sold_at as "soldAt",
        coalesce(l.negotiated, false) as negotiated,
        coalesce(l.buyer_name, '') as "buyerName",
        coalesce(l.city, '') as city
      from aloko_threads t
      left join aloko_listings l on l.id = t.listing_id
      where t.buyer_id = ${context.userId} or t.seller_id = ${context.userId}
      order by t.created_at desc
      limit 30
    `;
    const saves = (await sql<{ listing_id: string }>`select listing_id from aloko_saves where user_id = ${context.userId}`).map((row) => row.listing_id);
    const recent = await sql<{ id: string; title: string }>`
      select listing_id as id, title from aloko_views where user_id = ${context.userId} order by seen_at desc limit 8
    `;
    const used = listings.filter((item) => item.status !== "rejected").length;
    const creditsLeft = await allowance(sql, context.userId, profile.roles, used);
    const orders = await sql<OrderRow>`
      select id, kind, amount, status, listing_id as "listingId" from aloko_orders
      where user_id = ${context.userId} order by created_at desc limit 20
    `;
    const deals = await sql<{ id: string; title: string; soldPrice: number | null; city: string; soldAt: string | null }>`
      select id, title, sold_price as "soldPrice", city, sold_at as "soldAt"
      from aloko_listings where buyer_id = ${context.userId} and sold_at is not null
      order by sold_at desc limit 20
    `;
    let waitingOrders: OrderRow[] = [];
    let tape: TapeRow[] = [];
    let tapeQueue: TapeRow[] = [];
    let tapeFree = 0;
    let queue: AlokoRow[] = [];
    let serviceQueue: ServiceRow[] = [];
    let people: PersonRow[] = [];
    let trail: AuditRow[] = [];
    if (isStaff(profile.roles)) {
      queue = (
        await sql<ListingSql>`
          select id, title, price_naira, city, category, kind, image, seller_name, description, status, product_code, paused, sold_at, stock, sold_price, buyer_name, negotiated, area, state, lat, lng, coverage, featured_until, was_naira,
      coalesce((select verification = 'approved' and account_type = 'business' from aloko_profiles where user_id = aloko_listings.user_id), false) as business_verified
          from aloko_listings where status = 'pending' order by created_at desc limit 40
        `
      ).map(toRow);
      serviceQueue = (
        await sql<{ id: string; title: string; description: string; areas: string; price_note: string; status: string }>`
          select id, title, description, areas, price_note, status from aloko_services where status = 'pending' order by created_at desc limit 20
        `
      ).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        areas: row.areas,
        priceNote: row.price_note,
        status: asStatus(row.status),
      }));
      trail = await sql<AuditRow>`select id, action, target from aloko_audit order by created_at desc limit 20`;
    }
    if (profile.roles.includes("super_admin")) {
      const users = await sql<{ id: string; name: string; email: string; suspended: boolean | null; verification: string | null; business_name: string | null }>`
        select u.id, u.name, u.email, p.suspended, p.verification, p.business_name
        from "user" u
        left join aloko_profiles p on p.user_id = u.id
        order by u."createdAt" desc
        limit 40
      `;
      const memberships = await sql<{ user_id: string; role: string }>`select user_id, role from aloko_memberships`;
      people = users.map((person) => ({
        id: person.id,
        name: person.name,
        email: person.email,
        roles: memberships.filter((item) => item.user_id === person.id).map((item) => asRole(item.role)),
        suspended: Boolean(person.suspended),
        verification: person.verification ?? "none",
        businessName: person.business_name ?? "",
      }));
      waitingOrders = await sql<OrderRow>`
        select o.id, o.kind, o.amount, o.status, o.listing_id as "listingId", u.email
        from aloko_orders o
        join "user" u on u.id = o.user_id
        where o.status = 'unpaid'
        order by o.created_at asc
        limit 30
      `;
    }
    if (profile.roles.includes("business") || profile.roles.includes("service")) {
      tape = await sql<TapeRow>`select id, body, status, kind from aloko_tape where user_id = ${context.userId} order by created_at desc limit 12`;
      const freeRows = await sql<{ n: number }>`
        select count(*)::int as n from aloko_tape
        where user_id = ${context.userId} and kind = 'free' and status <> 'rejected'
          and week_key = to_char(now() at time zone 'Africa/Lagos', 'IYYY-"W"IW')
      `;
      tapeFree = Math.max(0, 3 - (freeRows[0]?.n ?? 0));
    }
    if (isStaff(profile.roles)) {
      tapeQueue = await sql<TapeRow>`
        select t.id, t.body, t.status, t.kind, coalesce(nullif(p.business_name, ''), u.email) as seller
        from aloko_tape t
        join "user" u on u.id = t.user_id
        left join aloko_profiles p on p.user_id = t.user_id
        where t.status = 'pending'
        order by t.created_at asc
        limit 30
      `;
    }
    return { profile, listings, services, threads, queue, serviceQueue, people, audit: trail, saves, recent, creditsLeft, orders, deals, waitingOrders, tape, tapeQueue, tapeFree };
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { displayName: string; serviceArea: string; businessName: string; city: string; interests: string }) => ({
    displayName: text(input?.displayName, 40),
    serviceArea: text(input?.serviceArea, 80),
    businessName: text(input?.businessName, 80),
    city: text(input?.city, 40),
    interests: text(input?.interests, 120),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    await profileOf(sql, context.userId);
    await sql`
      update aloko_profiles set
        display_name = ${data.displayName},
        service_area = ${data.serviceArea},
        business_name = ${data.businessName},
        city = ${data.city},
        interests = ${data.interests},
        updated_at = now()
      where user_id = ${context.userId}
    `;
    return data;
  });

export const activateRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((role: string) => {
    const next = text(role, 40);
    if (!(PUBLIC_ROLES as readonly string[]).includes(next)) throw new Error("That account type is not open to the public.");
    return next as (typeof PUBLIC_ROLES)[number];
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    await profileOf(sql, context.userId);
    await sql`insert into aloko_memberships (user_id, role) values (${context.userId}, ${data}) on conflict do nothing`;
    await sql`update aloko_profiles set account_type = ${data}, updated_at = now() where user_id = ${context.userId}`;
    return { role: data };
  });

export const setActiveRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((role: string) => asRole(text(role, 40)))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes(data)) throw new Error("That dashboard is not on this account.");
    await sql`update aloko_profiles set account_type = ${data}, updated_at = now() where user_id = ${context.userId}`;
    return { role: data };
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; description: string; price: number; was?: number; city: string; category: string; kind: string; image: string; seller: string; stock?: number }) => {
    const title = text(input?.title, 80);
    const description = text(input?.description, 500);
    const city = text(input?.city, 40);
    const category = text(input?.category, 40);
    const kind = text(input?.kind, 20);
    const image = String(input?.image ?? "");
    const seller = text(input?.seller, 40) || "Aloko member";
    const price = kind === "giveaway" ? 0 : Math.round(Number(input?.price));
    const stock = Math.max(1, Math.min(999, Math.round(Number(input?.stock ?? 1)) || 1));
    const wasRaw = Math.round(Number(input?.was));
    const was = kind !== "giveaway" && Number.isFinite(wasRaw) && wasRaw > 0 ? wasRaw : null;
    if (title.length < 4) throw new Error("Give the item a title of at least 4 characters.");
    if (description.length < 10) throw new Error("Add a short description so buyers know the condition.");
    if (!CITIES.includes(city)) throw new Error("Choose a city.");
    if (!CATEGORIES.includes(category)) throw new Error("Choose a category.");
    if (!(KINDS as readonly string[]).includes(kind)) throw new Error("Choose a listing type.");
    if (!image.startsWith("data:image/jpeg;base64,")) throw new Error("Add a photo.");
    if (image.length > 450000) throw new Error("That photo is too large. Try another.");
    if (kind !== "giveaway" && (!Number.isFinite(price) || price < 1 || price > 100000000)) throw new Error("Enter a whole naira price.");
    if (was != null && was <= price) throw new Error("The price before must be higher than the price now.");
    return { title, description, price, was, city, category, kind, image, seller, stock };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("individual") && !roles.includes("business")) {
      throw new Error("Activate Individual Seller or Business Seller before listing an item.");
    }
    const countRows = await sql<{ n: number }>`select count(*)::int as n from aloko_listings where user_id = ${context.userId} and status <> 'rejected'`;
    const used = countRows[0]?.n ?? 0;
    const allowanceLeft = await allowance(sql, context.userId, roles, used);
    if (allowanceLeft <= 0) throw new Error(roles.includes("business") ? "The catalogue is full. A paid business month opens 100 spaces." : "The free listings are used. Buy one more listing for ₦1,000. It starts after Aloko confirms the payment.");
    const stock = roles.includes("business") ? data.stock : 1;
    const seq = await sql<{ n: number }>`update aloko_codes set n = n + 1 where id = 1 returning n`;
    const code = `ALOKO-${PREFIX[data.category] ?? "ITM"}-${String(seq[0]?.n ?? used + 1).padStart(6, "0")}`;
    const id = crypto.randomUUID();
    await sql`
      insert into aloko_listings (
        id, user_id, title, description, price_naira, was_naira, city, category, kind, image, status, seller_name, product_code, stock
      ) values (
        ${id}, ${context.userId}, ${data.title}, ${data.description}, ${data.price}, ${data.was}, ${data.city}, ${data.category}, ${data.kind}, ${data.image}, 'pending', ${data.seller}, ${code}, ${stock}
      )
    `;
    const profiles = await sql<{ area: string; coverage: string }>`select area, coverage from aloko_profiles where user_id = ${context.userId}`;
    const spot = placeFor(data.city, profiles[0]?.area ?? "");
    await sql`
      update aloko_listings set
        area = ${spot?.area ?? ""},
        state = ${spot?.state ?? ""},
        lat = ${spot?.lat ?? null},
        lng = ${spot?.lng ?? null},
        coverage = ${profiles[0]?.coverage || "city"}
      where id = ${id}
    `;
    return { id, productCode: code };
  });

export const setListingState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; action: "pause" | "resume" | "sold" }) => {
    const id = text(input?.id, 80);
    const action = input?.action;
    if (!id || (action !== "pause" && action !== "resume" && action !== "sold")) throw new Error("That listing cannot be updated.");
    return { id, action };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    if (data.action === "sold") {
      const rows = await sql<{ id: string }>`
        update aloko_listings set sold_at = now(), paused = true, sold_price = price_naira, negotiated = false
        where id = ${data.id} and user_id = ${context.userId} and sold_at is null returning id
      `;
      if (!rows[0]) throw new Error("That listing is already sold or not yours.");
    } else {
      const paused = data.action === "pause";
      const rows = await sql<{ id: string }>`
        update aloko_listings set paused = ${paused} where id = ${data.id} and user_id = ${context.userId} and sold_at is null returning id
      `;
      if (!rows[0]) throw new Error("That listing cannot be changed.");
    }
    return { ok: true };
  });

export const decideListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: "active" | "rejected" }) => {
    const id = text(input?.id, 80);
    const status = input?.status === "rejected" ? "rejected" : input?.status === "active" ? "active" : "";
    if (!id || !status) throw new Error("That listing cannot be reviewed.");
    return { id, status };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    const roles = await rolesOf(sql, context.userId);
    if (!isStaff(roles)) throw new Error("Only Aloko staff can approve listings.");
    const rows = await sql<{ id: string; product_code: string }>`
      update aloko_listings set status = ${data.status}
      where id = ${data.id} and status = 'pending'
      returning id, product_code
    `;
    if (!rows[0]) throw new Error("That listing is not waiting.");
    await audit(sql, context.userId, data.status === "active" ? "approve-listing" : "reject-listing", rows[0].product_code || rows[0].id);
    return { ok: true };
  });

export const createService = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; description: string; areas: string; priceNote: string }) => {
    const title = text(input?.title, 80);
    const description = text(input?.description, 400);
    const areas = text(input?.areas, 120);
    const priceNote = text(input?.priceNote, 80);
    if (title.length < 4 || description.length < 10 || areas.length < 2 || priceNote.length < 2) {
      throw new Error("Add a service name, what you do, where you work, and a price or quote.");
    }
    return { title, description, areas, priceNote };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("service")) throw new Error("Activate Decluttering Service before publishing a service.");
    const id = crypto.randomUUID();
    await sql`
      insert into aloko_services (id, user_id, title, description, areas, price_note)
      values (${id}, ${context.userId}, ${data.title}, ${data.description}, ${data.areas}, ${data.priceNote})
    `;
    return { id };
  });

export const decideService = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: "active" | "rejected" }) => ({
    id: text(input?.id, 80),
    status: input?.status === "rejected" ? "rejected" as const : "active" as const,
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!isStaff(roles)) throw new Error("Only Aloko staff can approve services.");
    const rows = await sql<{ id: string }>`
      update aloko_services set status = ${data.status} where id = ${data.id} and status = 'pending' returning id
    `;
    if (!rows[0]) throw new Error("That service is not waiting.");
    await audit(sql, context.userId, data.status === "active" ? "approve-service" : "reject-service", data.id);
    return { ok: true };
  });

export const openThread = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { listingId: string; body: string }) => ({
    listingId: text(input?.listingId, 80),
    body: text(input?.body, 500),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    if (data.body.length < 2) throw new Error("Write a short message.");
    const listings = await sql<{ id: string; user_id: string; product_code: string; status: string }>`
      select id, user_id, product_code, status from aloko_listings where id = ${data.listingId}
    `;
    const listing = listings[0];
    if (!listing || listing.status !== "active") throw new Error("That listing is not open.");
    if (listing.user_id === context.userId) throw new Error("This is your own listing.");
    const existing = await sql<{ id: string }>`
      select id from aloko_threads where listing_id = ${listing.id} and buyer_id = ${context.userId}
    `;
    const threadId = existing[0]?.id ?? crypto.randomUUID();
    if (!existing[0]) {
      await sql`
        insert into aloko_threads (id, listing_id, product_code, buyer_id, seller_id)
        values (${threadId}, ${listing.id}, ${listing.product_code}, ${context.userId}, ${listing.user_id})
      `;
    }
    await sql`insert into aloko_messages (id, thread_id, sender_id, body) values (${crypto.randomUUID()}, ${threadId}, ${context.userId}, ${data.body})`;
    return { id: threadId, productCode: listing.product_code };
  });

export const toggleSave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => text(id, 80))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ listing_id: string }>`select listing_id from aloko_saves where user_id = ${context.userId} and listing_id = ${data}`;
    if (existing[0]) {
      await sql`delete from aloko_saves where user_id = ${context.userId} and listing_id = ${data}`;
      return { saved: false };
    }
    await sql`insert into aloko_saves (user_id, listing_id) values (${context.userId}, ${data})`;
    return { saved: true };
  });

export const recordView = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; title: string }) => ({ id: text(input?.id, 80), title: text(input?.title, 80) }))
  .handler(async ({ context, data }) => {
    if (!data.id || !data.title) return { ok: false };
    const sql = await getSql();
    await sql`
      insert into aloko_views (user_id, listing_id, title, seen_at) values (${context.userId}, ${data.id}, ${data.title}, now())
      on conflict (user_id, listing_id) do update set title = excluded.title, seen_at = now()
    `;
    return { ok: true };
  });

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { businessName: string; cacRef: string }) => ({
    businessName: text(input?.businessName, 80),
    cacRef: text(input?.cacRef, 40),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("business")) throw new Error("Verification is for business sellers.");
    if (data.businessName.length < 2 || data.cacRef.length < 3) throw new Error("Add the business name and CAC reference.");
    await sql`
      update aloko_profiles set business_name = ${data.businessName}, cac_ref = ${data.cacRef}, verification = 'submitted', updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const reviewBusiness = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; verification: "approved" | "rejected" }) => ({
    userId: text(input?.userId, 80),
    verification: input?.verification === "rejected" ? "rejected" as const : "approved" as const,
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("super_admin")) throw new Error("Only a super admin can decide verification.");
    await sql`update aloko_profiles set verification = ${data.verification} where user_id = ${data.userId}`;
    await audit(sql, context.userId, `verify-${data.verification}`, data.userId);
    return { ok: true };
  });

export const setSuspended = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; suspended: boolean }) => ({
    userId: text(input?.userId, 80),
    suspended: Boolean(input?.suspended),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("super_admin")) throw new Error("Only a super admin can suspend an account.");
    if (data.userId === context.userId) throw new Error("You cannot suspend your own account.");
    await profileOf(sql, data.userId);
    await sql`update aloko_profiles set suspended = ${data.suspended} where user_id = ${data.userId}`;
    await audit(sql, context.userId, data.suspended ? "suspend" : "restore", data.userId);
    return { ok: true };
  });

export const grantModerator = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((email: string) => text(email, 120).toLowerCase())
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("super_admin")) throw new Error("Only a super admin can add staff.");
    const users = await sql<{ id: string }>`select id from "user" where lower(email) = ${data}`;
    if (!users[0]) throw new Error("No account uses that email yet.");
    await sql`insert into aloko_memberships (user_id, role) values (${users[0].id}, 'moderator') on conflict do nothing`;
    await audit(sql, context.userId, "grant-moderator", data);
    return { ok: true };
  });

const WALLS = ["mint", "ink", "forest", "story"] as const;

export type ChatView = {
  id: string;
  productCode: string;
  title: string;
  asking: number;
  soldPrice: number | null;
  soldAt: string | null;
  city: string;
  buyerName: string;
  negotiated: boolean;
  iAmSeller: boolean;
  messages: { id: string; mine: boolean; body: string }[];
  offers: { id: string; amount: number; status: string }[];
  myStars: number;
  theirStars: number;
};

async function threadFor(sql: Sql, threadId: string, userId: string) {
  const rows = await sql<{ id: string; listing_id: string; product_code: string; buyer_id: string; seller_id: string }>`
    select id, listing_id, product_code, buyer_id, seller_id from aloko_threads where id = ${threadId}
  `;
  const thread = rows[0];
  if (!thread || (thread.buyer_id !== userId && thread.seller_id !== userId)) throw new Error("That chat is not yours.");
  return thread;
}

export const getChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => text(id, 80))
  .handler(async ({ context, data }): Promise<ChatView> => {
    const sql = await getSql();
    const thread = await threadFor(sql, data, context.userId);
    const listings = await sql<{ title: string; price_naira: number; sold_price: number | null; sold_at: string | null; city: string; buyer_name: string; negotiated: boolean }>`
      select title, price_naira, sold_price, sold_at, city, buyer_name, negotiated from aloko_listings where id = ${thread.listing_id}
    `;
    const listing = listings[0];
    const messages = await sql<{ id: string; sender_id: string; body: string }>`
      select id, sender_id, body from aloko_messages where thread_id = ${thread.id} order by created_at asc limit 50
    `;
    const offers = await sql<{ id: string; amount: number; status: string }>`
      select id, amount, status from aloko_offers where thread_id = ${thread.id} order by created_at asc
    `;
    const ratings = await sql<{ rater_id: string; stars: number }>`
      select rater_id, stars from aloko_ratings where thread_id = ${thread.id}
    `;
    const other = thread.buyer_id === context.userId ? thread.seller_id : thread.buyer_id;
    return {
      id: thread.id,
      productCode: thread.product_code,
      title: listing?.title ?? thread.product_code,
      asking: listing?.price_naira ?? 0,
      soldPrice: listing?.sold_price ?? null,
      soldAt: listing?.sold_at ?? null,
      city: listing?.city ?? "",
      buyerName: listing?.buyer_name ?? "",
      negotiated: Boolean(listing?.negotiated),
      iAmSeller: thread.seller_id === context.userId,
      messages: messages.map((item) => ({ id: item.id, mine: item.sender_id === context.userId, body: item.body })),
      offers,
      myStars: ratings.find((item) => item.rater_id === context.userId)?.stars ?? 0,
      theirStars: ratings.find((item) => item.rater_id === other)?.stars ?? 0,
    };
  });

export const sendOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { threadId: string; amount: number }) => ({
    threadId: text(input?.threadId, 80),
    amount: Math.round(Number(input?.amount)),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    const thread = await threadFor(sql, data.threadId, context.userId);
    if (thread.buyer_id !== context.userId) throw new Error("Only the buyer can make an offer.");
    const listings = await sql<{ price_naira: number; sold_at: string | null }>`
      select price_naira, sold_at from aloko_listings where id = ${thread.listing_id}
    `;
    const listing = listings[0];
    if (!listing || listing.sold_at) throw new Error("That item is already sold.");
    if (!Number.isFinite(data.amount) || data.amount < 1 || data.amount >= listing.price_naira) {
      throw new Error("Offer less than the asking price.");
    }
    const id = crypto.randomUUID();
    await sql`
      insert into aloko_offers (id, thread_id, listing_id, buyer_id, amount) values (${id}, ${thread.id}, ${thread.listing_id}, ${context.userId}, ${data.amount})
    `;
    await sql`
      insert into aloko_messages (id, thread_id, sender_id, body) values (${crypto.randomUUID()}, ${thread.id}, ${context.userId}, ${"Offer ₦" + data.amount.toLocaleString("en-NG")})
    `;
    return { id };
  });

export const acceptOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((offerId: string) => text(offerId, 80))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    const offers = await sql<{ id: string; thread_id: string; listing_id: string; buyer_id: string; amount: number; status: string }>`
      select id, thread_id, listing_id, buyer_id, amount, status from aloko_offers where id = ${data}
    `;
    const offer = offers[0];
    if (!offer || offer.status !== "open") throw new Error("That offer is not open.");
    const thread = await threadFor(sql, offer.thread_id, context.userId);
    if (thread.seller_id !== context.userId) throw new Error("Only the seller can accept an offer.");
    const buyers = await sql<{ name: string }>`select name from "user" where id = ${offer.buyer_id}`;
    const buyerName = buyers[0]?.name || "Buyer";
    const updated = await sql<{ id: string }>`
      update aloko_listings
      set sold_at = now(), paused = true, sold_price = ${offer.amount}, buyer_id = ${offer.buyer_id}, buyer_name = ${buyerName}, negotiated = true
      where id = ${offer.listing_id} and sold_at is null
      returning id
    `;
    if (!updated[0]) throw new Error("That item is already sold.");
    await sql`update aloko_offers set status = 'accepted' where id = ${offer.id}`;
    await sql`update aloko_offers set status = 'declined' where thread_id = ${offer.thread_id} and id <> ${offer.id} and status = 'open'`;
    await sql`
      insert into aloko_messages (id, thread_id, sender_id, body)
      values (${crypto.randomUUID()}, ${offer.thread_id}, ${context.userId}, ${"Accepted ₦" + offer.amount.toLocaleString("en-NG")})
    `;
    return { ok: true };
  });

export const rateChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { threadId: string; stars: number }) => {
    const stars = Math.round(Number(input?.stars));
    if (stars < 1 || stars > 5) throw new Error("Choose 1 to 5 stars.");
    return { threadId: text(input?.threadId, 80), stars };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await threadFor(sql, data.threadId, context.userId);
    await sql`
      insert into aloko_ratings (thread_id, rater_id, stars) values (${data.threadId}, ${context.userId}, ${data.stars})
      on conflict (thread_id, rater_id) do update set stars = excluded.stars
    `;
    return { ok: true };
  });

export const saveWallpaper = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((wall: string) => {
    const next = text(wall, 20);
    if (!(WALLS as readonly string[]).includes(next)) throw new Error("Choose one of the four wallpapers.");
    return next;
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await profileOf(sql, context.userId);
    await sql`update aloko_profiles set wallpaper = ${data} where user_id = ${context.userId}`;
    return { wallpaper: data };
  });

export const finishOnboarding = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { role: string; city: string; state: string; area: string; interests: string; businessName: string; serviceArea: string; radiusKm: number; coverage: string }) => {
    const role = text(input?.role, 40);
    if (!(PUBLIC_ROLES as readonly string[]).includes(role)) throw new Error("Choose how you want to use Aloko.");
    const radius = [0, 5, 10, 25, 50, 100].includes(Number(input?.radiusKm)) ? Number(input.radiusKm) : 0;
    const coverage = ["neighbourhood", "city", "state", "nationwide"].includes(input?.coverage) ? input.coverage : "city";
    return {
      role: role as (typeof PUBLIC_ROLES)[number],
      city: text(input?.city, 40),
      state: text(input?.state, 40),
      area: text(input?.area, 40),
      interests: text(input?.interests, 120),
      businessName: text(input?.businessName, 80),
      serviceArea: text(input?.serviceArea, 80),
      radiusKm: radius,
      coverage,
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    await profileOf(sql, context.userId);
    if (data.role === "business" && data.businessName.length < 2) throw new Error("Add the business name.");
    if (data.role === "service" && data.serviceArea.length < 2) throw new Error("Add where you work.");
    const spot = data.city ? placeFor(data.city, data.area) : undefined;
    await sql`insert into aloko_memberships (user_id, role) values (${context.userId}, ${data.role}) on conflict do nothing`;
    await sql`
      update aloko_profiles set
        account_type = ${data.role},
        city = ${data.city},
        state = ${spot?.state ?? data.state},
        area = ${spot?.area ?? ""},
        lat = ${spot?.lat ?? null},
        lng = ${spot?.lng ?? null},
        interests = ${data.interests},
        business_name = ${data.businessName},
        service_area = ${data.serviceArea || data.area},
        radius_km = ${data.radiusKm},
        coverage = ${data.coverage},
        onboarded = true,
        updated_at = now()
      where user_id = ${context.userId}
    `;
    return { role: data.role };
  });

export const listTape = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<{ id: string; body: string; seller: string }>`
    select t.id, t.body, coalesce(nullif(p.business_name, ''), 'A business') as seller
    from aloko_tape t
    left join aloko_profiles p on p.user_id = t.user_id
    where t.status = 'active' and t.created_at > now() - interval '7 days'
    order by t.created_at desc
    limit 20
  `;
});

export const postTape = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((body: string) => {
    const line = text(body, 80).replace(/\s+/g, " ");
    if (line.length < 8) throw new Error("Write at least 8 characters.");
    return line;
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("business") && !roles.includes("service")) throw new Error("Only a business or a decluttering service can post on the tape.");
    const week = await sql<{ week: string }>`select to_char(now() at time zone 'Africa/Lagos', 'IYYY-"W"IW') as week`;
    const weekKey = week[0]?.week ?? "";
    const used = await sql<{ n: number }>`
      select count(*)::int as n from aloko_tape
      where user_id = ${context.userId} and kind = 'free' and status <> 'rejected' and week_key = ${weekKey}
    `;
    const id = crypto.randomUUID();
    const free = (used[0]?.n ?? 0) < 3;
    await sql`
      insert into aloko_tape (id, user_id, body, kind, status, week_key)
      values (${id}, ${context.userId}, ${data}, ${free ? "free" : "paid"}, ${free ? "pending" : "hold"}, ${weekKey})
    `;
    if (!free) {
      await sql`
        insert into aloko_orders (id, user_id, kind, amount, listing_id)
        values (${crypto.randomUUID()}, ${context.userId}, 'tape_line', ${PRICES.tape_line}, ${id})
      `;
    }
    return { id, free };
  });

export const decideTape = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: "active" | "rejected" }) => ({
    id: text(input?.id, 80),
    status: input?.status === "rejected" ? "rejected" as const : "active" as const,
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!isStaff(roles)) throw new Error("Only Aloko staff can decide a tape line.");
    const rows = await sql<{ id: string }>`
      update aloko_tape set status = ${data.status}
      where id = ${data.id} and status = 'pending'
      returning id
    `;
    if (!rows[0]) throw new Error("That line is not waiting.");
    await audit(sql, context.userId, `tape-${data.status}`, data.id);
    return { ok: true };
  });

export const listLiveServices = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<{ id: string; title: string; areas: string; priceNote: string }>`
    select id, title, areas, price_note as "priceNote"
    from aloko_services where status = 'active' order by created_at desc limit 12
  `;
});

const DEFAULT_HOME: [string, string][] = [
  ["just_listed", "Just listed"],
  ["free", "Pass it on"],
  ["near", "Near you"],
  ["picks", "This week’s picks"],
  ["clearout", "Clear-out finds"],
  ["drops", "Price drops"],
  ["good", "Good as new"],
  ["second", "Second life"],
  ["wardrobe", "Wardrobe reboot"],
  ["electronics", "Electronics worth buying"],
  ["furniture", "Furniture around you"],
  ["home", "Home essentials"],
  ["verified", "Verified sellers"],
  ["services", "Need help clearing out?"],
];

export type HomeSection = { id: string; title: string; enabled: boolean; sort: number };

export const listHome = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const existing = await sql<{ n: number }>`select count(*)::int as n from aloko_home`;
  if ((existing[0]?.n ?? 0) === 0) {
    for (let i = 0; i < DEFAULT_HOME.length; i += 1) {
      const [id, title] = DEFAULT_HOME[i];
      await sql`insert into aloko_home (id, title, enabled, sort) values (${id}, ${title}, true, ${i + 1}) on conflict (id) do nothing`;
    }
  }
  return sql<HomeSection>`select id, title, enabled, sort from aloko_home order by sort asc, id asc`;
});

export const setHomeSection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; enabled?: boolean; direction?: "up" | "down" }) => ({
    id: text(input?.id, 40),
    enabled: typeof input?.enabled === "boolean" ? input.enabled : undefined,
    direction: input?.direction === "up" || input?.direction === "down" ? input.direction : undefined,
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("super_admin")) throw new Error("Only a super admin can change the home.");
    if (typeof data.enabled === "boolean") {
      await sql`update aloko_home set enabled = ${data.enabled} where id = ${data.id}`;
    }
    if (data.direction) {
      const rows = await sql<{ id: string; sort: number }>`select id, sort from aloko_home order by sort asc, id asc`;
      const index = rows.findIndex((row) => row.id === data.id);
      const swap = data.direction === "up" ? index - 1 : index + 1;
      if (index >= 0 && rows[swap]) {
        await sql`update aloko_home set sort = ${rows[swap].sort} where id = ${rows[index].id}`;
        await sql`update aloko_home set sort = ${rows[index].sort} where id = ${rows[swap].id}`;
      }
    }
    await audit(sql, context.userId, "home-section", data.id);
    return { ok: true };
  });

export type TicketMessage = { id: string; sender: string; body: string };
export type TicketView = { id: string; subject: string; status: string; email: string; messages: TicketMessage[] };

export const myTicket = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return null as TicketView | null;
});

export const openTicket = createServerFn({ method: "POST" })
  .validator((input: { email: string; name: string; subject: string; body: string }) => {
    const email = text(input?.email, 80).toLowerCase();
    const name = text(input?.name, 40) || "Aloko member";
    const subject = text(input?.subject, 80);
    const body = text(input?.body, 1000);
    if (!email.includes("@")) throw new Error("Add an email so support can reply.");
    if (subject.length < 3) throw new Error("Add a subject.");
    if (body.length < 8) throw new Error("Write a short message.");
    return { email, name, subject, body };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into aloko_tickets (id, email, name, subject) values (${id}, ${data.email}, ${data.name}, ${data.subject})
    `;
    await sql`
      insert into aloko_ticket_messages (id, ticket_id, sender, body)
      values (${crypto.randomUUID()}, ${id}, 'user', ${data.body})
    `;
    return { id };
  });

export const readTicket = createServerFn({ method: "POST" })
  .validator((id: string) => text(id, 80))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const tickets = await sql<{ id: string; subject: string; status: string; email: string }>`
      select id, subject, status, email from aloko_tickets where id = ${data}
    `;
    const ticket = tickets[0];
    if (!ticket) throw new Error("That ticket is not here.");
    const messages = await sql<TicketMessage>`
      select id, sender, body from aloko_ticket_messages where ticket_id = ${data} order by created_at asc
    `;
    return { ...ticket, messages };
  });

export const replyTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; body: string }) => ({ id: text(input?.id, 80), body: text(input?.body, 1000) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!isStaff(roles)) throw new Error("Only Aloko staff can reply as support.");
    if (data.body.length < 2) throw new Error("Write a reply.");
    await sql`
      insert into aloko_ticket_messages (id, ticket_id, sender, body)
      values (${crypto.randomUUID()}, ${data.id}, 'staff', ${data.body})
    `;
    await audit(sql, context.userId, "support-reply", data.id);
    return { ok: true };
  });

export const listTickets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!isStaff(roles)) throw new Error("Only Aloko staff can read support tickets.");
    return sql<{ id: string; subject: string; email: string; status: string }>`
      select id, subject, email, status from aloko_tickets order by created_at desc limit 30
    `;
  });

export const addTicketNote = createServerFn({ method: "POST" })
  .validator((input: { id: string; email: string; body: string }) => ({
    id: text(input?.id, 80),
    email: text(input?.email, 80).toLowerCase(),
    body: text(input?.body, 1000),
  }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    if (data.body.length < 2) throw new Error("Write a message.");
    const rows = await sql<{ id: string }>`
      select id from aloko_tickets where id = ${data.id} and email = ${data.email} and status = 'open'
    `;
    if (!rows[0]) throw new Error("That ticket is closed.");
    await sql`
      insert into aloko_ticket_messages (id, ticket_id, sender, body)
      values (${crypto.randomUUID()}, ${data.id}, 'user', ${data.body})
    `;
    return { ok: true };
  });

export const saveRadius = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((km: number) => {
    const radius = Number(km);
    if (![0, 5, 10, 25, 50, 100].includes(radius)) throw new Error("Choose a distance.");
    return radius;
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await profileOf(sql, context.userId);
    await sql`update aloko_profiles set radius_km = ${data} where user_id = ${context.userId}`;
    return { radiusKm: data };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { kind: string; listingId?: string }) => {
    const kind = text(input?.kind, 40);
    if (!(kind in PRICES)) throw new Error("That plan is not on the price list.");
    return { kind: kind as keyof typeof PRICES, listingId: text(input?.listingId, 80) };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await assertLive(sql, context.userId);
    const open = await sql<{ id: string }>`
      select id from aloko_orders
      where user_id = ${context.userId} and kind = ${data.kind} and listing_id = ${data.listingId} and status = 'unpaid'
      limit 1
    `;
    if (open[0]) throw new Error("That payment is already waiting for Aloko to confirm.");
    if (data.kind === "feature_listing") {
      const mine = await sql<{ id: string }>`select id from aloko_listings where id = ${data.listingId} and user_id = ${context.userId}`;
      if (!mine[0]) throw new Error("Feature a listing that is yours.");
    }
    const id = crypto.randomUUID();
    await sql`
      insert into aloko_orders (id, user_id, kind, amount, listing_id)
      values (${id}, ${context.userId}, ${data.kind}, ${PRICES[data.kind]}, ${data.listingId})
    `;
    return { id, amount: PRICES[data.kind] };
  });

export const confirmOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((orderId: string) => text(orderId, 80))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const roles = await rolesOf(sql, context.userId);
    if (!roles.includes("super_admin")) throw new Error("Only a super admin can confirm a payment.");
    const orders = await sql<{ id: string; user_id: string; kind: string; listing_id: string; status: string }>`
      select id, user_id, kind, listing_id, status from aloko_orders where id = ${data}
    `;
    const order = orders[0];
    if (!order || order.status !== "unpaid") throw new Error("That payment is not waiting.");
    await sql`update aloko_orders set status = 'paid' where id = ${order.id}`;
    if (order.kind === "feature_listing" && order.listing_id) {
      await sql`update aloko_listings set featured_until = now() + interval '7 days' where id = ${order.listing_id}`;
    }
    if (order.kind === "business_month" || order.kind === "service_month") {
      await sql`
        update aloko_profiles
        set plan_until = case when plan_until > now() then plan_until + interval '30 days' else now() + interval '30 days' end
        where user_id = ${order.user_id}
      `;
    }
    if (order.kind === "tape_line" && order.listing_id) {
      await sql`update aloko_tape set status = 'pending' where id = ${order.listing_id} and status = 'hold'`;
    }
    await audit(sql, context.userId, "confirm-payment", order.id);
    return { ok: true };
  });


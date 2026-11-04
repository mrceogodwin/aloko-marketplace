import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

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
};

export type ServiceRow = {
  id: string;
  title: string;
  description: string;
  areas: string;
  priceNote: string;
  status: "pending" | "active" | "rejected";
};

export type ThreadRow = { id: string; productCode: string; listingTitle: string; lastBody: string };
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
  }>`
    select display_name, account_type, service_area, business_name, city, interests, verification, cac_ref, suspended
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
  };
}

export const listLiveListings = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<ListingSql>`
    select id, title, price_naira, city, category, kind, image, seller_name, description, status, product_code, paused, sold_at, stock
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
        select id, title, price_naira, city, category, kind, image, seller_name, description, status, product_code, paused, sold_at, stock
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
        coalesce((select body from aloko_messages m where m.thread_id = t.id order by m.created_at desc limit 1), '') as "lastBody"
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
    const creditsLeft = profile.roles.includes("business") ? Math.max(0, 20 - used) : Math.max(0, 3 - used);
    let queue: AlokoRow[] = [];
    let serviceQueue: ServiceRow[] = [];
    let people: PersonRow[] = [];
    let trail: AuditRow[] = [];
    if (isStaff(profile.roles)) {
      queue = (
        await sql<ListingSql>`
          select id, title, price_naira, city, category, kind, image, seller_name, description, status, product_code, paused, sold_at, stock
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
    }
    return { profile, listings, services, threads, queue, serviceQueue, people, audit: trail, saves, recent, creditsLeft };
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
  .validator((input: { title: string; description: string; price: number; city: string; category: string; kind: string; image: string; seller: string; stock?: number }) => {
    const title = text(input?.title, 80);
    const description = text(input?.description, 500);
    const city = text(input?.city, 40);
    const category = text(input?.category, 40);
    const kind = text(input?.kind, 20);
    const image = String(input?.image ?? "");
    const seller = text(input?.seller, 40) || "Aloko member";
    const price = kind === "giveaway" ? 0 : Math.round(Number(input?.price));
    const stock = Math.max(1, Math.min(999, Math.round(Number(input?.stock ?? 1)) || 1));
    if (title.length < 4) throw new Error("Give the item a title of at least 4 characters.");
    if (description.length < 10) throw new Error("Add a short description so buyers know the condition.");
    if (!CITIES.includes(city)) throw new Error("Choose a city.");
    if (!CATEGORIES.includes(category)) throw new Error("Choose a category.");
    if (!(KINDS as readonly string[]).includes(kind)) throw new Error("Choose a listing type.");
    if (!image.startsWith("data:image/jpeg;base64,")) throw new Error("Add a photo.");
    if (image.length > 450000) throw new Error("That photo is too large. Try another.");
    if (kind !== "giveaway" && (!Number.isFinite(price) || price < 1 || price > 100000000)) throw new Error("Enter a whole naira price.");
    return { title, description, price, city, category, kind, image, seller, stock };
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
    const allowance = roles.includes("business") ? 20 : 3;
    if (used >= allowance) throw new Error(roles.includes("business") ? "The business catalogue limit is 20 until subscriptions open." : "The 3 free listings are used. Seller packages are not open yet.");
    const stock = roles.includes("business") ? data.stock : 1;
    const seq = await sql<{ n: number }>`update aloko_codes set n = n + 1 where id = 1 returning n`;
    const code = `ALOKO-${PREFIX[data.category] ?? "ITM"}-${String(seq[0]?.n ?? used + 1).padStart(6, "0")}`;
    const id = crypto.randomUUID();
    await sql`
      insert into aloko_listings (
        id, user_id, title, description, price_naira, city, category, kind, image, status, seller_name, product_code, stock
      ) values (
        ${id}, ${context.userId}, ${data.title}, ${data.description}, ${data.price}, ${data.city}, ${data.category}, ${data.kind}, ${data.image}, 'pending', ${data.seller}, ${code}, ${stock}
      )
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
        update aloko_listings set sold_at = now(), paused = true where id = ${data.id} and user_id = ${context.userId} and sold_at is null returning id
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

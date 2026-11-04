import { useState } from "react";
import { acceptOffer, getChat, rateChat, saveWallpaper, sendOffer, type ChatView, type ThreadRow } from "@/lib/aloko.functions";

export const WALLS = [
  { id: "mint", label: "Mint", src: "/aloko/wall/mint.jpg" },
  { id: "ink", label: "Ink", src: "/aloko/wall/ink.jpg" },
  { id: "forest", label: "Forest", src: "/aloko/wall/forest.jpg" },
  { id: "story", label: "Story", src: "/aloko/wall/story.jpg" },
] as const;

function money(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

export function PriceLine({ asking, soldPrice, negotiated }: { asking: number; soldPrice?: number | null; negotiated?: boolean }) {
  const dealt = soldPrice != null && soldPrice !== asking;
  return (
    <span className="price-pair">
      {dealt ? <s>{money(asking)}</s> : null}
      <b>{money(dealt ? soldPrice : asking)}</b>
      {negotiated ? <i className="neg-ico" title="Negotiated">N</i> : null}
    </span>
  );
}

export function SaleRecord({
  title,
  asking,
  soldPrice,
  negotiated,
  buyerName,
  soldAt,
  city,
  myStars,
  theirStars,
  onClose,
}: {
  title: string;
  asking: number;
  soldPrice: number | null;
  negotiated: boolean;
  buyerName: string;
  soldAt: string | null;
  city: string;
  myStars: number;
  theirStars: number;
  onClose: () => void;
}) {
  const when = soldAt ? new Date(soldAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
  return (
    <div className="detail" role="dialog" aria-modal="true" aria-label="Sale record">
      <div className="detail-card">
        <button className="linkish" type="button" onClick={onClose}>← Back</button>
        <h3>{title}</h3>
        <PriceLine asking={asking} soldPrice={soldPrice} negotiated={negotiated} />
        <p className="type-lead">{negotiated ? "Negotiated in chat." : "Sold at the asking price."}</p>
        <p><strong>Buyer</strong> {buyerName || "Not recorded"}</p>
        <p><strong>When</strong> {when}</p>
        <p><strong>Region</strong> {city || "Nigeria"}</p>
        <p><strong>Your rating</strong> {myStars ? `${myStars}/5` : "Not rated"}</p>
        <p><strong>Their rating</strong> {theirStars ? `${theirStars}/5` : "Not rated"}</p>
      </div>
    </div>
  );
}

export function ChatDesk({
  threads,
  wallpaper,
  onRefresh,
  onError,
}: {
  threads: ThreadRow[];
  wallpaper: string;
  onRefresh: () => void;
  onError: (message: string) => void;
}) {
  const [wall, setWall] = useState(wallpaper || "mint");
  const [openId, setOpenId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatView | null>(null);
  const [offer, setOffer] = useState("");
  const [saleOpen, setSaleOpen] = useState(false);
  const paper = WALLS.find((item) => item.id === wall) ?? WALLS[0];

  const fail = (err: unknown) => onError(err instanceof Error ? err.message : "That did not save.");

  const load = (id: string) => {
    setOpenId(id);
    void getChat({ data: id }).then(setChat).catch(fail);
  };

  const pickWall = (id: string) => {
    setWall(id);
    void saveWallpaper({ data: id }).then(onRefresh).catch(fail);
  };

  return (
    <div className="sheet">
      <h2>Messages</h2>
      <div className="wall-pick" role="listbox" aria-label="Chat wallpaper">
        {WALLS.map((item) => (
          <button key={item.id} type="button" className={item.id === wall ? "wall on" : "wall"} onClick={() => pickWall(item.id)} aria-label={item.label}>
            <img src={item.src} alt="" />
          </button>
        ))}
      </div>
      {!openId || !chat ? (
        threads.length === 0 ? (
          <p className="type-lead">No messages yet. Open a live listing and message the seller. The chat keeps that product’s ID.</p>
        ) : (
          threads.map((item) => (
            <button key={item.id} className="thread" type="button" onClick={() => load(item.id)}>
              <strong>{item.productCode} {item.negotiated ? <i className="neg-ico">N</i> : null}</strong>
              <span>{item.listingTitle}</span>
              <small>{item.soldPrice != null ? <PriceLine asking={item.asking} soldPrice={item.soldPrice} negotiated={item.negotiated} /> : item.lastBody}</small>
            </button>
          ))
        )
      ) : (
        <div className="chat-stage" style={{ backgroundImage: `url(${paper.src})` }}>
          <button className="linkish" type="button" onClick={() => { setOpenId(null); setChat(null); }}>← Inbox</button>
          <p className="chat-title">{chat.productCode} · {chat.title}</p>
          <p className="chat-title"><PriceLine asking={chat.asking} soldPrice={chat.soldPrice} negotiated={chat.negotiated} /></p>
          {chat.messages.map((item) => (
            <div key={item.id} className={item.mine ? "bubble me" : "bubble"}>{item.body}</div>
          ))}
          {chat.offers.filter((item) => item.status === "open").map((item) => (
            <div key={item.id} className="offer-row">
              <span>Open offer {money(item.amount)}</span>
              {chat.iAmSeller ? (
                <button className="primary" type="button" onClick={() => { void acceptOffer({ data: item.id }).then(() => { load(chat.id); onRefresh(); }).catch(fail); }}>Accept</button>
              ) : null}
            </div>
          ))}
          {chat.soldAt ? <button className="ghost" type="button" onClick={() => setSaleOpen(true)}>Sale record</button> : null}
          {saleOpen && chat.soldAt ? (
            <SaleRecord
              title={chat.title}
              asking={chat.asking}
              soldPrice={chat.soldPrice}
              negotiated={chat.negotiated}
              buyerName={chat.buyerName}
              soldAt={chat.soldAt}
              city={chat.city}
              myStars={chat.myStars}
              theirStars={chat.theirStars}
              onClose={() => setSaleOpen(false)}
            />
          ) : null}
          {!chat.soldAt && !chat.iAmSeller ? (
            <form className="form" onSubmit={(event) => { event.preventDefault(); void sendOffer({ data: { threadId: chat.id, amount: Number(offer) } }).then(() => { setOffer(""); load(chat.id); }).catch(fail); }}>
              <label>Your offer<input value={offer} onChange={(event) => setOffer(event.target.value)} inputMode="numeric" placeholder="Less than the asking price" /></label>
              <button className="primary" type="submit">Negotiate</button>
            </form>
          ) : null}
          <div className="star-row" aria-label="Rate this conversation">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" className={star <= chat.myStars ? "star on" : "star"} onClick={() => { void rateChat({ data: { threadId: chat.id, stars: star } }).then(() => load(chat.id)).catch(fail); }}>{star}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

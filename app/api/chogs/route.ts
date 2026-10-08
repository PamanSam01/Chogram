import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SAMPLE_CHOGS } from "@/lib/fixtures";
import { CHOG_GENESIS, IPFS_GATEWAYS, MONAD_RPC, httpImageUrl } from "@/lib/sources";
import type { ChogNFT, Trait } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BLOCKSCOUT = "https://monscout.cp0x.com"; // Blockscout instance for Monad, keyless
const SUPPLY = 1969;
const OWNER_RE = /^0x[0-9a-fA-F]{40}$/;

/** Art we already mirror on disk — local files render instantly (Remotion-safe). */
const LOCAL_IMAGES: Record<string, string> = {
  "1613": "/chogs/nft-1613.jpg",
  "1584": "/chogs/nft-1584.jpg",
  "1473": "/chogs/nft-1473.jpg",
  "1806": "/chogs/nft-1806.jpg",
  "1298": "/chogs/nft-1298.jpg",
  "777": "/chogs/nft-777.jpg",
};

type RarityTable = { method?: string; total?: number; ranks?: Record<string, number> };
type StaticMeta = Record<string, { name?: string; image?: string; attributes?: Trait[] }>;

let rarityTable: RarityTable | null = null;
let staticMeta: StaticMeta | null = null;
const liveMeta = new Map<string, { name?: string; image?: string; attributes?: Trait[] } | null>();

async function loadRarity(): Promise<RarityTable | null> {
  if (rarityTable) return rarityTable;
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "fixtures", "rarity.json"),
      "utf8"
    );
    rarityTable = JSON.parse(raw) as RarityTable;
  } catch {
    rarityTable = null;
  }
  return rarityTable;
}

async function loadStaticMeta(): Promise<StaticMeta | null> {
  if (staticMeta) return staticMeta;
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "fixtures", "chog-meta.json"),
      "utf8"
    );
    staticMeta = JSON.parse(raw) as StaticMeta;
  } catch {
    staticMeta = null;
  }
  return staticMeta;
}

function rpcCall(data: string): Promise<string> {
  return fetch(MONAD_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: CHOG_GENESIS, data }, "latest"],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  })
    .then(async (r) => {
      if (!r.ok) throw new Error(`rpc HTTP ${r.status}`);
      const j = (await r.json()) as { result?: string; error?: unknown };
      if (!j.result) throw new Error("rpc error");
      return j.result;
    });
}

function decodeAbiString(hex: string): string {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length < 128) return "";
  const off = parseInt(h.slice(0, 64), 16) * 2;
  const len = parseInt(h.slice(off, off + 64), 16) * 2;
  if (!Number.isFinite(off) || !Number.isFinite(len)) return "";
  return Buffer.from(h.slice(off + 64, off + 64 + len), "hex").toString("utf8");
}

/** Source 1: Blockscout REST — addresses/{owner}/nft, filtered to Chog Genesis. */
async function blockscoutIds(owner: string): Promise<string[] | null> {
  try {
    const ids: string[] = [];
    let url: string | null = `${BLOCKSCOUT}/api/v2/addresses/${owner}/nft`;
    for (let page = 0; page < 5 && url; page++) {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      if (!res.ok) return ids.length > 0 ? ids : null;
      const data = (await res.json()) as {
        items?: { id?: string; token?: { address_hash?: string } }[];
        next_page_params?: Record<string, string | number> | null;
      };
      if (!Array.isArray(data.items)) return null;
      for (const it of data.items) {
        const addr = it.token?.address_hash;
        if (
          typeof addr === "string" &&
          addr.toLowerCase() === CHOG_GENESIS.toLowerCase() &&
          it.id != null
        ) {
          ids.push(String(it.id));
        }
      }
      const npp = data.next_page_params;
      url =
        npp && Object.keys(npp).length > 0
          ? `${BLOCKSCOUT}/api/v2/addresses/${owner}/nft?${new URLSearchParams(
              Object.entries(npp).map(([k, v]) => [k, String(v)])
            )}`
          : null;
    }
    return Array.from(new Set(ids));
  } catch {
    return null;
  }
}

/** Source 2: on-chain scan — ownerOf(1..1969) batched over Monad RPC. Null on ANY batch failure. */
async function rpcOwnedIds(owner: string): Promise<string[] | null> {
  const target = owner.toLowerCase();
  const ids: string[] = [];
  try {
    for (let start = 1; start <= SUPPLY; start += 100) {
      const chunk: number[] = [];
      for (let t = start; t < start + 100 && t <= SUPPLY; t++) chunk.push(t);
      const body = JSON.stringify(
        chunk.map((t, j) => ({
          jsonrpc: "2.0",
          id: j,
          method: "eth_call",
          params: [
            { to: CHOG_GENESIS, data: "0x6352211e" + t.toString(16).padStart(64, "0") },
            "latest",
          ],
        }))
      );
      let done = false;
      for (let attempt = 0; attempt < 4 && !done; attempt++) {
        try {
          const res = await fetch(MONAD_RPC, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
            cache: "no-store",
            signal: AbortSignal.timeout(30000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arr = (await res.json()) as { id?: number; result?: string }[];
          // The RPC answers per-item inside a batch: one rate-limited item has no
          // `result`. Skipping it would silently under-report, so fail the batch.
          if (!Array.isArray(arr) || arr.length !== chunk.length) throw new Error("short batch");
          for (const item of arr) {
            if (!item.result || item.id == null) throw new Error("item missing result");
          }
          for (const item of arr) {
            const r = item.result as string;
            const holder = "0x" + r.slice(-40);
            if (holder.toLowerCase() === target) ids.push(String(chunk[item.id as number]));
          }
          done = true;
        } catch {
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        }
      }
      if (!done) return null; // partial results would silently under-report
    }
    return ids;
  } catch {
    return null;
  }
}

/** Cross-check specific ids against ownerOf on-chain. Null = RPC unavailable (caller keeps source's list). */
async function verifyOwned(ids: string[], owner: string): Promise<string[] | null> {
  const target = owner.toLowerCase();
  const keep: string[] = [];
  try {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const body = JSON.stringify(
        chunk.map((t, j) => ({
          jsonrpc: "2.0",
          id: j,
          method: "eth_call",
          params: [
            { to: CHOG_GENESIS, data: "0x6352211e" + Number(t).toString(16).padStart(64, "0") },
            "latest",
          ],
        }))
      );
      const res = await fetch(MONAD_RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const arr = (await res.json()) as { id?: number; result?: string }[];
      if (!Array.isArray(arr) || arr.length !== chunk.length) return null;
      for (const item of arr) {
        if (item.id == null || !item.result) return null; // incomplete answer → don't drop tokens
        if (("0x" + item.result.slice(-40)).toLowerCase() === target) keep.push(chunk[item.id]);
      }
    }
    return keep;
  } catch {
    return null;
  }
}

type Meta = { name?: string; image?: string; attributes?: Trait[] };

async function fetchMeta(id: string): Promise<Meta | null> {
  if (liveMeta.has(id)) return liveMeta.get(id) ?? null;
  const cached = (await loadStaticMeta())?.[id];
  if (cached) {
    liveMeta.set(id, cached);
    return cached;
  }
  let uri = "";
  try {
    uri = decodeAbiString(await rpcCall("0xc87b56dd" + id.padStart(64, "0")));
  } catch {
    liveMeta.set(id, null);
    return null;
  }
  if (!uri) {
    liveMeta.set(id, null);
    return null;
  }
  const target = uri.startsWith("ipfs://") ? uri.slice(7) : uri;
  const urls = uri.startsWith("ipfs://")
    ? IPFS_GATEWAYS.map((g) => `${g}/${target}`)
    : [uri];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const j = (await res.json()) as Meta;
      if (j && typeof j === "object") {
        const value: Meta = {
          name: typeof j.name === "string" ? j.name : undefined,
          image: typeof j.image === "string" ? j.image : undefined,
          attributes: Array.isArray(j.attributes)
            ? j.attributes.filter(
                (a): a is Trait =>
                  !!a && typeof a.trait_type === "string" && a.value !== undefined
              )
            : [],
        };
        liveMeta.set(id, value);
        return value;
      }
    } catch {
      /* try next gateway */
    }
  }
  liveMeta.set(id, null);
  return null;
}

function toChog(id: string, holder: string, meta: Meta | null, rank: number): ChogNFT {
  const image = LOCAL_IMAGES[id] ?? (meta?.image ? httpImageUrl(meta.image) : "");
  return {
    tokenId: id,
    collection: "Chog Genesis",
    name: meta?.name ?? `CHOG #${id}`,
    image: image || "/chogs/chogbadge.jpg", // last-resort art only if metadata is unreachable
    traits: meta?.attributes ?? [],
    rarityRank: rank,
    rarityPercentile: rank > 0 ? Number((1 - (rank - 1) / SUPPLY).toFixed(4)) : 0,
    holder,
  };
}

/**
 * GET /api/chogs?owner=0x...
 * Ownership chain: Blockscout REST → on-chain ownerOf scan → fixtures.
 * `source` says which one answered: "blockscout" | "monad-rpc" |
 * "blockscout+monad-rpc" | "fixture".
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner") ?? "";
  if (!OWNER_RE.test(owner)) {
    return NextResponse.json(
      { owner, chogs: [], source: "invalid-owner", error: "expected 0x + 40 hex chars" },
      { status: 400 }
    );
  }

  const bs = await blockscoutIds(owner);
  let ids: string[] = [];
  let source: string;

  if (bs !== null && bs.length > 0) {
    const verified = await verifyOwned(bs, owner);
    ids = verified ?? bs; // if RPC is down we still trust the fresh Blockscout index
    source = "blockscout";
  } else {
    const onchain = await rpcOwnedIds(owner);
    if (onchain !== null && onchain.length > 0) {
      ids = onchain;
      source = "monad-rpc";
    } else if (bs !== null && onchain !== null) {
      source = "blockscout+monad-rpc"; // both live sources agree the wallet owns no Chogs
    } else if (onchain !== null) {
      source = "monad-rpc";
    } else if (bs !== null) {
      source = "blockscout";
    } else {
      return NextResponse.json({ owner, chogs: SAMPLE_CHOGS, source: "fixture" });
    }
  }

  if (ids.length === 0) {
    return NextResponse.json({ owner, chogs: [], source });
  }

  const rarity = await loadRarity();
  const ranks = rarity?.ranks ?? {};
  const metas = await Promise.all(ids.map((id) => fetchMeta(id)));
  const chogs = ids
    .map((id, i) => toChog(id, owner, metas[i], Number(ranks[id] ?? 0)))
    .sort((a, b) => Number(a.tokenId) - Number(b.tokenId));

  return NextResponse.json({ owner, chogs, source });
}

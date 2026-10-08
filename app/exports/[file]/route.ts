import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

/**
 * Serves files written to public/exports/ AFTER `next build`.
 * `next start` only maps public/ files that existed at build time, so
 * render output needs a runtime handler. Always forces download.
 */
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]*$/i;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ file: string }> }
): Promise<Response> {
  const { file } = await ctx.params;
  if (!SAFE_NAME.test(file) || !file.toLowerCase().endsWith(".mp4")) {
    return new Response("Not found", { status: 404 });
  }
  const abs = path.join(process.cwd(), "public", "exports", file);
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return new Response("Not found", { status: 404 });
    const web = Readable.toWeb(createReadStream(abs)) as ReadableStream;
    return new Response(web, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${file}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

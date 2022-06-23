import ethers from "ethers";
import { DOMAIN, TYPES } from "../constants/typedData";

const PATHNAME_PREFIX = "/live/";
const STREAM_PREFIX = "stream";

// PUSH_REWRITE payload:
// full current push url (string)
// connection hostname (string)
// currently parsed stream name (string)
function handlePushRewrite(text: string): string {
  const rtmpString = text.split("\n")[0];
  const { protocol, pathname } = new URL(rtmpString);
  if (protocol !== "rtmp:") {
    throw new Error("only rtmp urls allowed for now");
  }
  if (!pathname.startsWith(PATHNAME_PREFIX)) {
    throw new Error(`RTMP URLs must start with ${PATHNAME_PREFIX}`);
  }
  return pathname.slice(PATHNAME_PREFIX.length);
}

// DEFAULT_STREAM payload:
// current defaultStream setting (string)
// requested stream name (string)
// viewer host (string)
// output type (string)
// full request URL (string, may be blank for non-URL-based requests!)
function handleDefaultStream(text: string): string {
  const streamName = text.split("\n")[1];
  return `${STREAM_PREFIX}+${streamName}`;
}

async function handleRequest(request: Request): Promise<Response> {
  try {
    if (request.method !== "POST") {
      return Response.redirect("https://livepeer.name");
    }
    const { pathname } = new URL(request.url);
    const text = await request.text();
    let b64;
    if (pathname === "/hooks/PUSH_REWRITE") {
      b64 = handlePushRewrite(text);
    } else if (pathname === "/hooks/DEFAULT_STREAM") {
      // TODO: .eth and .lens lookups can go in here!
      const streamName = handleDefaultStream(text);
      return new Response(streamName);
    } else if (pathname === "/") {
      b64 = text;
    } else {
      return new Response("not found", { status: 404 });
    }
    const data = JSON.parse(atob(b64));
    const addr = ethers.utils
      .verifyTypedData(DOMAIN, TYPES, data.message, data.signature)
      .toLowerCase();
    return new Response(`${STREAM_PREFIX}+${addr}`);
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request as Request));
});

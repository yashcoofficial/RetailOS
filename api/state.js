import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { sessionFromRequest } from "../server/auth.js";

const STATE_PATH = "retailos/shared-state.json";

function send(response, status, payload) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  return response.status(status).json(payload);
}

async function readRecord() {
  const result = await get(STATE_PATH, { access: "private", useCache: false });
  if (!result) return null;
  const text = await new Response(result.stream).text();
  const record = JSON.parse(text);
  return { record, etag: result.blob.etag };
}

async function requestBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (!request.body) return {};
  return JSON.parse(request.body);
}

function publicSnapshot(current) {
  if (!current) return null;
  return {
    data: current.record.data,
    revision: Number(current.record.revision),
    updatedAt: current.record.updatedAt,
  };
}

async function saveRecord(current, data) {
  const record = {
    data,
    revision: Number(current?.record.revision || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  const options = {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  };
  if (current?.etag) options.ifMatch = current.etag;
  await put(STATE_PATH, JSON.stringify(record), options);
  return record;
}

export default async function handler(request, response) {
  if (!sessionFromRequest(request)) return send(response, 401, { error: "Your admin session has expired. Please sign in again." });

  try {
    if (request.method === "GET") {
      const current = await readRecord();
      return send(response, 200, { snapshot: publicSnapshot(current) });
    }

    if (request.method !== "POST" && request.method !== "PUT") {
      response.setHeader("Allow", "GET, POST, PUT");
      return send(response, 405, { error: "Method not allowed." });
    }

    const body = await requestBody(request);
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
      return send(response, 400, { error: "Store data is invalid." });
    }

    const current = await readRecord();
    const expectedRevision = Number(body.expectedRevision);
    const currentRevision = Number(current?.record.revision || 0);
    if (!Number.isFinite(expectedRevision) || expectedRevision !== currentRevision) {
      return send(response, 409, { error: "Store data changed on another device.", snapshot: publicSnapshot(current) });
    }

    try {
      const record = await saveRecord(current, body.data);
      return send(response, 200, { snapshot: { data: record.data, revision: record.revision, updatedAt: record.updatedAt } });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        const latest = await readRecord();
        return send(response, 409, { error: "Store data changed on another device.", snapshot: publicSnapshot(latest) });
      }
      throw error;
    }
  } catch (error) {
    const missingBlobStore = !process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID;
    const message = missingBlobStore
      ? "Shared storage is not connected. Connect a Vercel Blob store to this project, then redeploy."
      : "Shared store data could not be read or saved.";
    console.error("RetailOS state API error", error);
    return send(response, 503, { error: message });
  }
}

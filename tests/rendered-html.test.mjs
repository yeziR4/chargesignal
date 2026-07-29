import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Context Passport experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Context Passport/);
  assert.match(html, /Your AI history/);
  assert.match(html, /Context Passport/);
  assert.match(html, /Choose your history/);
  assert.match(html, /ChatGPT/);
  assert.match(html, /Claude/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("renders the Vana approval return page", async () => {
  const response = await render("/connect/return");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Approval complete/);
});

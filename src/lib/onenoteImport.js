// src/lib/onenoteImport.js
import { PublicClientApplication } from "@azure/msal-browser";

const msal = new PublicClientApplication({
  auth: { clientId: "<YOUR_CLIENT_ID>", redirectUri: window.location.origin },
});
const scopes = ["Notes.Read"]; // you can add "offline_access" if you want refresh tokens

export async function loginAndGetToken() {
  const account =
    msal.getAllAccounts()[0] ||
    (await msal.loginPopup({ scopes })).account;
  const { accessToken } = await msal
    .acquireTokenSilent({ account, scopes })
    .catch(() => msal.acquireTokenPopup({ scopes }));
  return accessToken;
}

export async function pickAndImportOneNotePage(editorRef, setHtml) {
  const token = await loginAndGetToken();

  // 1️⃣ List recent OneNote pages
  const pagesRes = await fetch(
    "https://graph.microsoft.com/v1.0/me/onenote/pages?$top=25",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const { value: pages } = await pagesRes.json();

  if (!pages?.length) {
    alert("No OneNote pages found.");
    return;
  }

  // 2️⃣ (Optional) choose first page for now
  const page = pages[0];

  // 3️⃣ Fetch its content
  const htmlRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/onenote/pages/${page.id}/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const html = await htmlRes.text();

  // 4️⃣ Import HTML into Quill
  const q = editorRef.current?.getEditor?.();
  if (!q) return;
  const delta = q.clipboard.convert({ html });
  q.setContents(delta, "user");
  setHtml(q.root.innerHTML);
}

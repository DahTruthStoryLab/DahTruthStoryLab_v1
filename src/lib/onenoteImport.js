// src/lib/onenoteImport.js
import { PublicClientApplication } from "@azure/msal-browser";

const CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID; // from .env / Amplify env
if (!CLIENT_ID) {
  console.warn("[OneNote] Missing VITE_MSAL_CLIENT_ID env var");
}

const msal = new PublicClientApplication({
  auth: {
    clientId: CLIENT_ID,
    redirectUri: window.location.origin, // must be in Azure App → Authentication
  },
});

const scopes = ["Notes.Read"]; // add "offline_access" later if you want longer sessions

export async function loginAndGetToken() {
  const account =
    msal.getAllAccounts()[0] ||
    (await msal.loginPopup({ scopes })).account;

  const { accessToken } = await msal
    .acquireTokenSilent({ account, scopes })
    .catch(() => msal.acquireTokenPopup({ scopes }));

  return accessToken;
}

export async function pickAndImportOneNotePage(editorRefOrGetter, setHtml) {
  // Support either a ref OR your getActiveEditor() function
  const editorRef =
    typeof editorRefOrGetter === "function"
      ? editorRefOrGetter()
      : editorRefOrGetter;

  const token = await loginAndGetToken();

  // 1) List recent OneNote pages
  const pagesRes = await fetch(
    "https://graph.microsoft.com/v1.0/me/onenote/pages?$top=25",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const { value: pages } = await pagesRes.json();
  if (!pages?.length) {
    alert("No OneNote pages found.");
    return;
  }

  // TODO: show a picker UI; for now take the first page:
  const page = pages[0];

  // 2) Fetch page HTML
  const htmlRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/onenote/pages/${page.id}/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const html = await htmlRes.text();

  // 3) Insert into Quill
  const q = editorRef?.getEditor?.();
  if (!q) return;

  const delta = q.clipboard.convert({ html });
  q.setContents(delta, "user");
  setHtml(q.root.innerHTML);
}

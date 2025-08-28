import { Store } from "@tauri-apps/plugin-store";

async function getStore() {
  return await Store.load(".rh_app.store.json");
}

export async function saveToken(token: string) {
  const store = await getStore();
  await store.set("token", token);
  await store.save();
}

export async function getToken(): Promise<string | null> {
  const store = await getStore();
  const v = await store.get<string>("token");
  return v ?? null;
}

export async function clearToken() {
  const store = await getStore();
  await store.delete("token");
  await store.save();
}

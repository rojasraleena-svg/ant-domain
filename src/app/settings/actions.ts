"use server";

import { getSession } from "@/lib/auth";
import { createApiKey, deleteApiKey } from "@/lib/apiKey";
import { revalidatePath } from "next/cache";

export async function createKeyAction(formData: FormData) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  if (!name || name.trim().length === 0 || name.length > 50) {
    throw new Error("请输入有效的密钥名称 (1-50字符)");
  }

  const rawKey = await createApiKey(user.id, name.trim());
  revalidatePath("/settings");
  
  return { rawKey };
}

export async function deleteKeyAction(keyId: string) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  await deleteApiKey(user.id, keyId);
  revalidatePath("/settings");
}
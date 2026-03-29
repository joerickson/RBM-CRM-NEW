"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function signOut() {
  redirect("/login");
}

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  return currentUser();
}

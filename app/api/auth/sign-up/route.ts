import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { createSession, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json().catch(() => ({}));
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return NextResponse.json({ error: "Enter a name, valid email, and password of at least 8 characters." }, { status: 400 });
  }
  await connectDB();
  if (await User.exists({ email: email.toLowerCase() })) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }
  const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash: await hashPassword(password) });
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, createSession(user._id.toString()), sessionCookieOptions);
  return response;
}

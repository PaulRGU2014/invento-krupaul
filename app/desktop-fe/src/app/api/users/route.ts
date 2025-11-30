import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";

interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
}

const dataPath = path.join(process.cwd(), "data", "users.json");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Load existing users
    let users: User[] = [];
    try {
      const raw = await fs.readFile(dataPath, "utf8");
      users = JSON.parse(raw || "[]");
    } catch (err) {
      // If file doesn't exist or is invalid, start fresh
      users = [];
    }

    const existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const newUser: User = {
      id: Date.now().toString(),
      email,
      passwordHash,
      name,
    };

    users.push(newUser);
    await fs.writeFile(dataPath, JSON.stringify(users, null, 2), "utf8");

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

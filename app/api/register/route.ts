//app/api/register/route.ts
import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role } = body; // 👈 Added phone

    if (!name || !email || !phone || !password) { // 👈 Added phone validation
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Prevent admin registration through this endpoint
    if (role && role !== "customer") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectMongo();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone, // 👈 Added phone
      password,
      role: "customer" // Force customer role
    });

    await user.save();

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
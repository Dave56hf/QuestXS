import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { EmailTemplate } from "../../../components/email-template/email-template";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, role } = (await req.json()) as {
      fullName?: string;
      email?: string;
      role?: string;
    };

    if (!fullName || !email || !role) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();

    const { error: dbError } = await supabase
      .from("waitlist")
      .insert([{ full_name: fullName, email, role }]);

    if (dbError) {
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "This email is already on the waitlist." },
          { status: 409 },
        );
      }
      throw dbError;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const firstName = fullName.split(" ")[0];

    // Render your React email template to HTML string
    const htmlContent = await render(
      EmailTemplate({ firstName })
    );

    await transporter.sendMail({
      from: `Quest <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "You're on the Quest waitlist!",
      html: htmlContent,
    });

    return NextResponse.json(
      { success: true, message: "You're on the list!" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Waitlist error:", err);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
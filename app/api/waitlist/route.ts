import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { Resend } from "resend";
import { EmailTemplate } from "../../../components/email-template/email-template";

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new Error("Resend API key is not configured.");
    }

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

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: "QuestXS <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to QuestXS",
      react: EmailTemplate({
        firstName: fullName.split(" ")[0],
      }),
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

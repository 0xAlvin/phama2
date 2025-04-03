import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // In a real application, you would:
    // 1. Check if the email exists in your database.
    // 2. Generate a unique token.
    // 3. Store the token and the user's email in your database.
    // 4. Send an email to the user with a link containing the token.
    // For this example, we'll just simulate the process.

    console.log(`Password reset requested for email: ${email}`);

    // Simulate success
    return NextResponse.json({ message: "Password reset email sent successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error in forgot password API:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

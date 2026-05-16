import { NextRequest, NextResponse } from "next/server";
import { sendLineNotify } from "@/lib/services/notificationService";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        await sendLineNotify(message);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Notify API Error:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

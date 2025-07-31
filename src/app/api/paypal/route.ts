/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
const crc32 = require("buffer-crc32");

const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID ?? "WEBHOOK_ID";
const CACHE_DIR = path.join(process.cwd(), "temp", "paypal-certs");

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error("Directory exists");
  }
}

async function downloadAndCache(
  url: string,
  cacheKey?: string,
): Promise<string> {
  await ensureCacheDir();

  if (!cacheKey) {
    cacheKey = url.replace(/\W+/g, "-");
  }
  const filePath = path.join(CACHE_DIR, cacheKey);

  // Check if cached file exists
  try {
    const cachedData = await fs.readFile(filePath, "utf-8");
    return cachedData;
  } catch {
    // File doesn't exist, continue to download
  }

  // Download the file if not cached
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download certificate: ${response.statusText}`);
  }

  const data = await response.text();
  await fs.writeFile(filePath, data);

  return data;
}

async function verifySignature(
  event: Buffer,
  headers: Record<string, string>,
): Promise<boolean> {
  try {
    const transmissionId = headers["paypal-transmission-id"];
    const timeStamp = headers["paypal-transmission-time"];
    const certUrl = headers["paypal-cert-url"];
    const signature = headers["paypal-transmission-sig"];

    if (
      !transmissionId ||
      !timeStamp ||
      !certUrl ||
      !signature ||
      !WEBHOOK_ID
    ) {
      console.error("Missing required headers or webhook ID");
      return false;
    }

    // Calculate CRC32 of raw event data - crc32.signed() returns a number directly
    const crc = crc32.signed(event);

    // Reconstruct the message that PayPal signed
    const message = `${transmissionId}|${timeStamp}|${WEBHOOK_ID}|${crc}`;
    console.log(`Original signed message: ${message}`);

    // Download and cache PayPal's certificate
    const certPem = await downloadAndCache(certUrl);

    // Create buffer from base64-encoded signature
    const signatureBuffer = Buffer.from(signature, "base64");

    // Create a verification object
    const verifier = crypto.createVerify("SHA256");
    verifier.update(message);

    return verifier.verify(certPem, signatureBuffer);
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body as buffer
    const body = await request.arrayBuffer();
    const event = Buffer.from(body);

    // Parse JSON for processing
    const data = JSON.parse(event.toString());

    // Get headers (Next.js headers are case-insensitive)
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    console.log("Received PayPal webhook:", {
      eventType: data.event_type,
      id: data.id,
      transmissionId: headers["paypal-transmission-id"],
    });

    // Verify the webhook signature
    const isSignatureValid = await verifySignature(event, headers);

    if (isSignatureValid) {
      console.log("Signature is valid");

      // Process the webhook event based on type
      await processWebhookEvent(data);
    } else {
      console.error(" Signature verification failed for event:", data.id);
      // You might want to log this for security monitoring
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing PayPal webhook:", error);
    // Still return 200 to prevent PayPal from retrying
    return NextResponse.json({ error: "Processing error" }, { status: 200 });
  }
}

async function processWebhookEvent(data: any) {
  const eventType = data.event_type;

  console.log(`Processing event: ${eventType}`);

  switch (eventType) {
    case "PAYMENT.SALE.COMPLETED":
      await handlePaymentCompleted(data);
      break;

    case "PAYMENT.SALE.DENIED":
      await handlePaymentDenied(data);
      break;

    case "BILLING.SUBSCRIPTION.CREATED":
      await handleSubscriptionCreated(data);
      break;

    case "BILLING.SUBSCRIPTION.ACTIVATED":
      await handleSubscriptionActivated(data);
      break;

    case "BILLING.SUBSCRIPTION.UPDATED":
      await handleSubscriptionUpdated(data);
      break;

    case "BILLING.SUBSCRIPTION.EXPIRED":
      await handleSubscriptionExpired(data);
      break;

    case "BILLING.SUBSCRIPTION.CANCELLED":
      await handleSubscriptionCancelled(data);
      break;

    case "BILLING.SUBSCRIPTION.SUSPENDED":
      await handleSubscriptionSuspended(data);
      break;

    default:
      console.log(`Unhandled event type: ${eventType}`);
  }
}

async function handlePaymentCompleted(data: any) {
  const payment = data.resource;
  console.log(
    `Payment completed: ${payment.id} for ${payment.amount.value} ${payment.amount.currency_code}`,
  );

  // Mark the subscription as paid (e.g., store in payment history)
  // Extend subscription access (if it's a renewal)
  // Send payment receipt email to user
  // Log transaction for reporting/analytics
}

async function handlePaymentDenied(data: any) {
  const payment = data.resource;
  console.log(`Payment denied: ${payment.id}`);

  // Log failed payment attempt
  // Flag user for possible access suspension
  // Notify user via email to update payment method
}

async function handleSubscriptionCreated(data: any) {
  const subscription = data.resource;
  console.log(`Subscription created: ${subscription.id}`);

  //  Only log or store the initial subscription data
  //  Wait for "ACTIVATED" event to actually grant access
  // (Optional) Store initial metadata or preferences
}

async function handleSubscriptionActivated(data: any) {
  const subscription = data.resource;
  console.log(`Subscription activated: ${subscription.id}`);

  // Grant access to premium features
  // Create or update user subscription record in DB
  // Send welcome/activation email
}

async function handleSubscriptionUpdated(data: any) {
  const subscription = data.resource;
  console.log(`Subscription updated: ${subscription.id}`);

  // Update user's subscription data in your DB
  //  Optionally notify user of changes (e.g., plan or billing cycle)
}

async function handleSubscriptionExpired(data: any) {
  const subscription = data.resource;
  console.log(`Subscription expired: ${subscription.id}`);

  //  Revoke access to premium features
  //  Send "Your subscription expired" email
  //  Archive or update DB status to "expired"
}

async function handleSubscriptionCancelled(data: any) {
  const subscription = data.resource;
  console.log(`Subscription cancelled: ${subscription.id}`);

  //  Mark user subscription as cancelled in DB
  //  Revoke access after end of billing cycle (or immediately)
  //  Send cancellation confirmation email
}

async function handleSubscriptionSuspended(data: any) {
  const subscription = data.resource;
  console.log(`Subscription suspended: ${subscription.id}`);

  //  Temporarily suspend access to premium features
  //  Notify user and possibly explain why (e.g., failed payment)
}

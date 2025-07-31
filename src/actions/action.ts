"use server";

const clientId = process.env.PAYPAL_CLIENT_ID;
const secretKey = process.env.PAYPAL_SECRET_KEY;
const accessToken = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
const isProduction = process.env.NODE_ENV === "production";
const url = isProduction
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export async function cancelSubscription(
  subscriptionId: string,
  reason: string,
) {
  try {
    const response = await fetch(
      `${url}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Cancel subscription failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error("Failed to cancel subscription");
    }
    const cancelData = await response.json();
    console.log("CANCEL DATA", cancelData);

    return { success: true, message: "Subscription cancelled" };
  } catch (e) {
    console.log("ERROR", e);
  }
}

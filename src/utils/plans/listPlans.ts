import dotenv from "dotenv";

dotenv.config();

const clientId = process.env.PAYPAL_CLIENT_ID;
const secretKey = process.env.PAYPAL_SECRET_KEY;
console.log(clientId, secretKey)
const isProduction = process.env.NODE_ENV === "production";
const url = isProduction
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";
const accessToken = Buffer.from(`${clientId}:${secretKey}`).toString("base64");

async function getPlans() {
  try {
    const response = await fetch(
      `${url}/v1/billing/plans?sort_by=create_time&sort_order=desc`,
      {
        headers: {
          Authorization: `Basic ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`PayPal API Error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log("Products:", result);

    return result;
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
}

(async () => {
  try {
    await getPlans();
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  }
})();

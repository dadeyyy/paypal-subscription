import dotenv from "dotenv";

dotenv.config();

const clientId = process.env.PAYPAL_CLIENT_ID;
const secretKey = process.env.PAYPAL_SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";
const url = isProduction
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";
const accessToken = Buffer.from(`${clientId}:${secretKey}`).toString("base64");

async function getProductLists() {
  try {
    if (!clientId || !secretKey) {
      throw new Error(
        "PayPal credentials are missing. Please set PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY environment variables.",
      );
    }
    const response = await fetch(
      `${url}/v1/catalogs/products?page_size=2&page=1&total_required=true`,
      {
        headers: {
          Authorization: `Basic ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
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
    await getProductLists();
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  }
})();

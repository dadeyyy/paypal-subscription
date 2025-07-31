import { randomUUID } from "crypto";
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.PAYPAL_CLIENT_ID;
const secretKey = process.env.PAYPAL_SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";
const url = isProduction
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";
const accessToken = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
const requestId = randomUUID();

type ProductTypeEnum = "PHYSICAL" | "DIGITAL" | "SERVICE"; //Default - PHYSICAL
type ProductType = {
  id?: string; 
  name: string; 
  description?: string; 
  type: ProductTypeEnum;
  category?: string; 
  image_url?: string; 
  home_url?: string;
};

const sampleProduct: ProductType = {
  name: "Video Streaming Service",
  description: "Video streaming service",
  type: "SERVICE",
  category: "SOFTWARE",
  image_url: "https://example.com/streaming.jpg",
  home_url: "https://example.com/home",
};

async function generateSubscriptionPlan(product: ProductType) {
  try {
    if (!clientId || !secretKey) {
      throw new Error("PayPal credentials are missing. Please set PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY environment variables.");
    }
    const response = await fetch(`${url}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Paypal-Request-Id": requestId,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`PayPal API Error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log("Product created successfully:", result);

    //Save the information to db
    return result;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

(async () => {
  try {
    await generateSubscriptionPlan(sampleProduct);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
})();


// Sample Response :

// Product created successfully: {
//   id: 'PROD-6UA38396NN859464A',
//   name: 'Video Streaming Service',
//   description: 'Video streaming service',
//   create_time: '2025-07-30T02:08:10Z',
//   links: [
//     {
//       href: 'https://api.sandbox.paypal.com/v1/catalogs/products/PROD-6UA38396NN859464A',
//       rel: 'self',
//       method: 'GET'
//     },
//     {
//       href: 'https://api.sandbox.paypal.com/v1/catalogs/products/PROD-6UA38396NN859464A',
//       rel: 'edit',
//       method: 'PATCH'
//     }
//   ]
// }
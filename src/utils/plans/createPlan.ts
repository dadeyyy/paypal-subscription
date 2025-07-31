import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const clientId = process.env.PAYPAL_CLIENT_ID;
const secretKey = process.env.PAYPAL_SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";
const url = isProduction
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";
const accessToken = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
const paypalRequestId = randomUUID();

type Frequency = {
  interval_unit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  interval_count: number;
};

type PricingScheme = {
  fixed_price: {
    value: string; // must be stringified decimal
    currency_code: string; // e.g. "PHP/USD"
  };
  pricing_model?: "VOLUME" | "TIERED";
  tiers?: {
    starting_quantity: string;
    ending_quantity?: string;
    amount: {
      currency_code: string;
      value: string;
    };
  };
};

type BillingCycle = {
  tenure_type: "REGULAR" | "TRIAL";
  sequence: number;
  total_cycles?: number; // 0 = infinite Default 1
  pricing_scheme: PricingScheme;
  frequency: Frequency;
};

type PaymentPreferences = {
  auto_bill_outstanding?: boolean;
  setup_fee?: {
    value: string;
    currency_code: string;
  };
  setup_fee_failure_action?: "CONTINUE" | "CANCEL";
  payment_failure_threshold?: number;
};

type Taxes = {
  percentage: string;
  inclusive: boolean;
};

type PlanType = {
  product_id: string;
  name: string;
  status?: "CREATED" | "INACTIVE" | "ACTIVE";
  description?: string;
  billing_cycles: BillingCycle[];
  payment_preferences?: PaymentPreferences;
  quantity_supported?: boolean;
  taxes?: Taxes;
};

async function createSubscriptionPlan(data: PlanType) {
  try {
    const response = await fetch(`${url}/v1/billing/plans`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "PayPal-Request-Id": paypalRequestId,
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`PayPal API Error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log("Plan Created", result);

    return result;
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
}

const plan: PlanType = {
  name: "Premium Plan",
  description: "Premium plan for Formsly",
  product_id: "PROD-6UA38396NN859464A",
  billing_cycles: [
    {
      frequency: {
        interval_unit: "MONTH",
        interval_count: 1,
      },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: {
        fixed_price: {
          value: "20",
          currency_code: "USD",
        },
      },
    },
  ],
  payment_preferences: {
    auto_bill_outstanding: true,
    payment_failure_threshold: 1,
  },
};

(async () => {
  try {
    await createSubscriptionPlan(plan);
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  }
})();





// const sampleData: PlanType = {
//   product_id: "PROD-6UA38396NN859464A",
//   name: "Basic Plan",
//   description: "Basic Plan for Formsly",
//   status: "ACTIVE",
//   billing_cycles: [
//     {
//       frequency: { interval_unit: "MONTH", interval_count: 1 },
//       tenure_type: "TRIAL",
//       sequence: 1,
//       total_cycles: 2,
//       pricing_scheme: { fixed_price: { value: "3", currency_code: "USD" } },
//     },
//     {
//       frequency: { interval_unit: "MONTH", interval_count: 1 },
//       tenure_type: "TRIAL",
//       sequence: 2,
//       total_cycles: 3,
//       pricing_scheme: { fixed_price: { value: "6", currency_code: "USD" } },
//     },
//     {
//       frequency: { interval_unit: "MONTH", interval_count: 1 },
//       tenure_type: "REGULAR",
//       sequence: 3,
//       total_cycles: 12,
//       pricing_scheme: { fixed_price: { value: "10", currency_code: "USD" } },
//     },
//   ],
//   payment_preferences: {
//     auto_bill_outstanding: true,
//     setup_fee: { value: "3", currency_code: "USD" },
//     setup_fee_failure_action: "CONTINUE",
//     payment_failure_threshold: 3,
//   },
//   taxes: { percentage: "10", inclusive: false },
// };
"use client";

import {
  FUNDING,
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";

interface PaypalBtnProps {
  selectedPlan: "BASIC" | "PREMIUM";
  planId: string;
}

interface PayPalActions {
  subscription: {
    create: (details: { plan_id: string }) => Promise<string>;
  };
}

export default function PaypalBtn({ selectedPlan, planId }: PaypalBtnProps) {
  const router = useRouter();
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Complete Your {selectedPlan} Plan Subscription
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          Secure payment powered by PayPal
        </p>
      </div>

      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
          currency: "USD",
          intent: "subscription",
          vault: true,
        }}
      >
        <PayPalButtons
          fundingSource={FUNDING.PAYPAL}
          createSubscription={(data, actions: PayPalActions) => {
            return actions.subscription.create({
              plan_id: planId,
            });
          }}
          onApprove={async (data, actions) => {
            console.log("Subscription approved!", {
              subscriptionID: data.subscriptionID,
              selectedPlan: selectedPlan,
              planId: planId,
            });
            if (data.subscriptionID) {
              const subs = {
                subscriptionID: data.subscriptionID,
                authorized: true,
              };
              localStorage.setItem("subs", JSON.stringify(subs));
              router.push("/protected");
            }
            //Verify the subscription in paypal api (GET /v1/billing/subscriptions/{id})
            //Save it to the database
            //Optionally, allow access to the user/temporary access, or you can let the webhook handle it for you
          }}
          onError={(err) => {
            console.error("Subscription error", err);
          }}
          style={{
            layout: "vertical",
          }}
        />
      </PayPalScriptProvider>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Plan ID: {planId}</p>
        <p>Selected: {selectedPlan} Plan</p>
      </div>
    </div>
  );
}

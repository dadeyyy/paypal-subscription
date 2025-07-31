"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelSubscription } from "@/actions/action";

export default function ProtectedComponent() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [details, setDetails] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const subs = localStorage.getItem("subs");
    if (!subs) return router.push("/");

    const subscriptionID = JSON.parse(subs).subscriptionID;
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const secretKey = process.env.NEXT_PUBLIC_PAYPAL_SECRET_KEY;
    const accessToken = Buffer.from(`${clientId}:${secretKey}`).toString(
      "base64",
    );

    async function getSubsDetails() {
      setLoading(true);
      const response = await fetch(
        `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionID}`,
        {
          headers: {
            Authorization: `Basic ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
      const data = await response.json();
      console.log(data);
      setDetails(data);
      setLoading(false);
    }

    getSubsDetails();
  }, [router]);

  if (loading) {
    return (
      <div className="text-center mt-8 text-gray-600">
        Loading subscription info...
      </div>
    );
  }

  if (!details || details.status !== "ACTIVE") {
    return (
      <div className="text-center mt-8 text-red-600">
        Invalid or inactive subscription
      </div>
    );
  }

  const handleCancelSubscription = async () => {
    console.log("ID", details, "REASON", cancelReason);
    const cancelSubs = await cancelSubscription(details.id, cancelReason);
    if (cancelSubs?.success) alert(cancelSubs.message);
    localStorage.removeItem("subs");
    router.push("/");
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-200 mb-5">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Subscription Information
        </h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Identifiers
          </h2>
          <ul className="space-y-1 text-gray-700">
            <li>
              <span className="font-medium">Plan ID:</span> {details.plan_id}
            </li>
            <li>
              <span className="font-medium">Subscription ID:</span> {details.id}
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Subscriber Information
          </h2>
          <ul className="space-y-1 text-gray-700">
            <li>
              <span className="font-medium">Email:</span>{" "}
              {details.subscriber.email_address}
            </li>
            <li>
              <span className="font-medium">Name:</span>{" "}
              {details.subscriber.name.given_name}{" "}
              {details.subscriber.name.surname}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Billing Information
          </h2>
          <ul className="space-y-1 text-gray-700">
            <li>
              <span className="font-medium">Subscription Start:</span>{" "}
              {new Date(details.start_time).toDateString()}
            </li>
            <li>
              <span className="font-medium">Next Billing:</span>{" "}
              {new Date(details.billing_info.next_billing_time).toDateString()}
            </li>
            <li>
              <span className="font-medium">Last Payment:</span>{" "}
              {new Date(details.billing_info.last_payment.time).toDateString()}
            </li>
            <li>
              <span className="font-medium">Last Payment Amount:</span>{" "}
              {details.billing_info.last_payment.amount.value}{" "}
              {details.billing_info.last_payment.amount.currency_code}
            </li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col">
            <label htmlFor="reason">Reason</label>
            <input
              id="reason"
              className="border rounded-xl py-2"
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <button
            onClick={handleCancelSubscription}
            className=" p-4 cursor-pointer rounded-lg bg-blue-300"
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
}

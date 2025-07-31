"use client";

import { useEffect, useState } from "react";
import PaypalBtn from "./PaypalBtn";
import AvailablePlans from "./AvailablePlans";
import { useRouter } from "next/navigation";

export default function Plans() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"BASIC" | "PREMIUM">(
    "BASIC",
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    "P-55X58066BF485863GNCE4ACY",
  );

  useEffect(() => {
    const authorized = localStorage.getItem("subs");
    if (authorized) router.push("/protected");
  }, [router]);

  const handlePlanSelect = (
    planType: "BASIC" | "PREMIUM",
    paypalPlanId: string,
  ): void => {
    setSelectedPlan(planType);
    setSelectedPlanId(paypalPlanId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <AvailablePlans
          selectedPlan={selectedPlan}
          onPlanSelect={handlePlanSelect}
        />

        <div className="max-w-md mx-auto mt-8">
          <PaypalBtn selectedPlan={selectedPlan} planId={selectedPlanId} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

type Plan = {
  id: "BASIC" | "PREMIUM";
  name: string;
  price: string;
  period: string;
  features: string[];
  paypalPlanId: string;
  popular?: boolean;
};

interface AvailablePlansProps {
  onPlanSelect: (planType: "BASIC" | "PREMIUM", paypalPlanId: string) => void;
  selectedPlan: "BASIC" | "PREMIUM";
}

export default function AvailablePlans({
  onPlanSelect,
  selectedPlan,
}: AvailablePlansProps) {
  const plans: Plan[] = [
    {
      id: "BASIC",
      name: "Basic Plan",
      price: "$10",
      period: "month",
      features: [
        "3$ for first 2 months",
        "6$ for the next 3 months",
        "Basic features",
        "Email support",
        "Basic analytics",
      ],
      paypalPlanId: "P-55X58066BF485863GNCE4ACY",
    },
    {
      id: "PREMIUM",
      name: "Premium Plan",
      price: "$19.99",
      period: "month",
      features: [
        "All basic features",
        "Priority support",
        "Advanced analytics",
        "Custom integrations",
        "Team collaboration",
      ],
      paypalPlanId: "P-97X887650Y118031XNCE4GVY",
      popular: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600">Select the perfect plan for your needs</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 ${
              selectedPlan === plan.id
                ? "border-blue-500 shadow-lg bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
            onClick={() => onPlanSelect(plan.id, plan.paypalPlanId)}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-gray-700">-{feature}</span>
                </li>
              ))}
            </ul>

            <div
              className={`w-full py-3 px-4 rounded-lg text-center font-medium transition-colors ${
                selectedPlan === plan.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {selectedPlan === plan.id ? "Selected" : "Select Plan"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

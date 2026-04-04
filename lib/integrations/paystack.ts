export type PaystackSubscriptionTier = "FREE" | "PREMIUM";

export async function createPaystackCustomer(email: string) {
  return { customerId: "stub-paystack-customer-id", email };
}

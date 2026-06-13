// Payment abstraction.
//
// In production this wraps a real PSP (Stripe). When no STRIPE_SECRET_KEY is
// configured (local dev, CI, demo), it falls back to a simulated provider that
// instantly "succeeds" — so the whole booking/checkout flow is exercisable
// end-to-end without external dependencies or keys.
//
// To go live: set STRIPE_SECRET_KEY, `npm i stripe`, and replace the body of
// `charge()` with a Stripe PaymentIntent. The rest of the app is unchanged.

export interface ChargeInput {
  amount: number; // in the major currency unit (euros)
  description: string;
}

export interface ChargeResult {
  provider: "stripe" | "mock";
  providerRef: string;
  status: "SUCCEEDED" | "FAILED";
}

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

export function isLivePayments(): boolean {
  return Boolean(STRIPE_KEY);
}

export async function charge(input: ChargeInput): Promise<ChargeResult> {
  if (STRIPE_KEY) {
    // Real integration goes here, e.g.:
    //   const stripe = new Stripe(STRIPE_KEY);
    //   const intent = await stripe.paymentIntents.create({
    //     amount: Math.round(input.amount * 100), currency: "eur",
    //     description: input.description, confirm: true, ...
    //   });
    //   return { provider: "stripe", providerRef: intent.id,
    //            status: intent.status === "succeeded" ? "SUCCEEDED" : "FAILED" };
    throw new Error("Stripe configured but integration not implemented in this scaffold");
  }

  // Simulated PSP: deterministic success.
  return {
    provider: "mock",
    providerRef: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: "SUCCEEDED",
  };
}

// Default deposit policy: 30% of the service price, rounded, to secure a slot.
export function depositFor(price: number): number {
  if (price <= 0) return 0;
  return Math.max(1, Math.round(price * 0.3));
}

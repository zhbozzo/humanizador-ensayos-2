export function initPaddle() {
  try {
    // @ts-ignore
    if (typeof Paddle !== 'undefined') {
      // @ts-ignore
      Paddle.Initialize({
        environment: (import.meta as any).env?.VITE_PADDLE_ENV || 'sandbox',
        token: (import.meta as any).env?.VITE_PADDLE_CLIENT_TOKEN || '',
      });
    }
  } catch {}
}

export function openCheckout(priceId: string, email?: string) {
  // @ts-ignore
  if (typeof Paddle === 'undefined') return;
  // @ts-ignore
  Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    ...(email ? { customer: { email } } : {}),
  });
}



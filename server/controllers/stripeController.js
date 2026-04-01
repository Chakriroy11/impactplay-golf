const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const { supabase } = require('../lib/supabase');

// Create Stripe Checkout Session for Subscription (Monthly or Yearly)
async function createCheckoutSession(req, res) {
  const { user_id, email, planType } = req.body;

  if (!user_id || !email) {
    return res.status(400).json({ error: 'Missing user_id or email for checkout' });
  }

  // Define price IDs mathematically tied to the PRIZE_CONTRIBUTION_AMOUNT mapping
  const PRICE_IDS = {
    monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
    yearly: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_placeholder',
  };

  const selectedPriceId = PRICE_IDS[planType];
  if (!selectedPriceId) return res.status(400).json({ error: 'Invalid plan type' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        user_id: user_id, // Important so webhook can update DB
      },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
    });

    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ error: 'Failed to create Stripe checkout session' });
  }
}

// Stripe webhook handler to activate/deactivate subscriptions
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Requires Express raw body parser to compare signatures accurately
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const user_id = session.metadata.user_id;

      if (user_id) {
        // Update Supabase to mark subscription as active
        const { error } = await supabase
          .from('users')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_status: 'active',
          })
          .eq('id', user_id);

        if (error) console.error('Database update failed:', error);
      }
      break;

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      // If status is not 'active' or 'trialing', deactivate user platform access
      if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
         // Query by stripe_subscription_id instead
         await supabase
          .from('users')
          .update({ subscription_status: 'inactive' })
          .eq('stripe_subscription_id', subscription.id);
      }
      break;
      
    default:
      console.log(`Unhandled stripe event type ${event.type}`);
  }

  res.status(200).send({ received: true });
}

module.exports = {
  createCheckoutSession,
  handleWebhook
};

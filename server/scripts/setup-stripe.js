require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[❌] Missing STRIPE_SECRET_KEY in environment. Cannot configure Stripe products.');
  process.exit(1);
}

async function setupStripe() {
  console.log('--- STARTING STRIPE PRODUCT GENERATION ---');
  try {
    // 1. Create the core Product
    const product = await stripe.products.create({
      name: 'Golf Charity Subscription',
      description: 'Access to the performance stats, monthly draw pool, and global charity impact.',
      active: true,
    });
    console.log(`[✅] Product Created: ${product.id}`);

    // 2. Create Monthly Price ($29.00 USD)
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 2900, // Amount in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      active: true,
      metadata: {
        prize_pool_contribution: "10.00"
      }
    });
    console.log(`[✅] Monthly Price Created: ${monthlyPrice.id} ($29.00/mo)`);

    // 3. Create Yearly Price ($290.00 USD - 2 months free)
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 29000, // Amount in cents
      currency: 'usd',
      recurring: { interval: 'year' },
      active: true,
      metadata: {
        prize_pool_contribution: "100.00"
      }
    });
    console.log(`[✅] Yearly Price Created: ${yearlyPrice.id} ($290.00/yr)`);

    console.log('\n--- SETUP COMPLETE ---');
    console.log('Make sure to assign these IDs to your .env file:');
    console.log(`\nSTRIPE_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`STRIPE_PRICE_YEARLY=${yearlyPrice.id}`);
    console.log(`PRIZE_CONTRIBUTION_AMOUNT=10.00    # Default monthly baseline for pool logic`);
    
  } catch (err) {
    console.error(`[❌] Stripe Setup Failed:`, err);
  }
}

setupStripe();

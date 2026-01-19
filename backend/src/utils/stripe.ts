/**
 * Stripe Service
 * Handles Stripe payment processing and customer management
 */

import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
} as any)

export async function createStripeCustomer(userId: string, email: string, metadata?: Record<string, string>) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        ...metadata,
      },
    })
    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

export async function getStripeCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return customer
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error)
    throw error
  }
}

export async function createSetupIntent(customerId: string) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    })
    return setupIntent
  } catch (error) {
    console.error('Error creating setup intent:', error)
    throw error
  }
}

export async function attachPaymentMethod(paymentMethodId: string, customerId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })
    return paymentMethod
  } catch (error) {
    console.error('Error attaching payment method:', error)
    throw error
  }
}

export async function detachPaymentMethod(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId)
    return paymentMethod
  } catch (error) {
    console.error('Error detaching payment method:', error)
    throw error
  }
}

export async function listPaymentMethods(customerId: string, type: 'card' | 'us_bank_account' = 'card') {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type,
    })
    return paymentMethods
  } catch (error) {
    console.error('Error listing payment methods:', error)
    throw error
  }
}

export async function setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })
    return customer
  } catch (error) {
    console.error('Error setting default payment method:', error)
    throw error
  }
}

export async function createPaymentIntent(
  customerId: string,
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    })
    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

export async function confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet`,
    })
    return paymentIntent
  } catch (error) {
    console.error('Error confirming payment intent:', error)
    throw error
  }
}

export default stripe

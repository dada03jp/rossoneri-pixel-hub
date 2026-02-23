// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Stripe webhook to handle checkout.session.completed
// Updates profiles.plan_type to 'premium' when payment succeeds

let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
    if (!stripeInstance) {
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2024-12-18.acacia' as any,
        });
    }
    return stripeInstance;
}

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
    if (!supabaseAdminInstance) {
        supabaseAdminInstance = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
    }
    return supabaseAdminInstance;
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;
            const customerId = session.customer as string;

            if (userId) {
                // Update profile to premium
                const { error } = await getSupabaseAdmin()
                    .from('profiles')
                    .update({
                        plan_type: 'premium',
                        is_premium: true,
                        stripe_customer_id: customerId,
                    } as any)
                    .eq('id', userId);

                if (error) {
                    console.error('Failed to update profile:', error);
                    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
                }

                console.log(`✅ User ${userId} upgraded to premium`);
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            // Find user by stripe_customer_id and downgrade
            const { data: profiles } = await getSupabaseAdmin()
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .limit(1) as any;

            if (profiles && profiles.length > 0) {
                await getSupabaseAdmin()
                    .from('profiles')
                    .update({
                        plan_type: 'free',
                        is_premium: false,
                    } as any)
                    .eq('id', profiles[0].id);

                console.log(`⬇️ User ${profiles[0].id} downgraded to free`);
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

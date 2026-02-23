import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Stripe SDK を追加後に本実装
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const session = await stripe.checkout.sessions.create({
    //     mode: 'subscription',
    //     customer_email: user.email,
    //     line_items: [{
    //         price: process.env.STRIPE_PREMIUM_PRICE_ID!,
    //         quantity: 1,
    //     }],
    //     success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/mypage?upgrade=success`,
    //     cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/mypage?upgrade=cancel`,
    //     metadata: { user_id: user.id },
    // });
    // return NextResponse.json({ url: session.url });

    // 仮: Stripe未設定時のフォールバック
    return NextResponse.json({
        message: 'Stripe Checkout is not yet configured. Set STRIPE_SECRET_KEY and STRIPE_PREMIUM_PRICE_ID env vars.',
        url: null,
    }, { status: 501 });
}

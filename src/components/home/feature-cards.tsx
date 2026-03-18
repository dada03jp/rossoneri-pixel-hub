import { Star, MessageSquare, Trophy } from 'lucide-react';

interface FeatureCardsProps {
    accentColor: string;
}

const features = [
    {
        icon: Star,
        title: '10点満点で選手採点',
        description: '試合ごとに全選手をファン目線で評価。あなたの採点が反映されます。',
    },
    {
        icon: MessageSquare,
        title: 'コメントで感想を残せる',
        description: '選手ごとに感想や意見をシェア。試合の振り返りがもっと楽しくなります。',
    },
    {
        icon: Trophy,
        title: 'みんなの採点でMVPが見える',
        description: 'ファンの投票結果から、その試合のMVPが分かります。',
    },
];

export function FeatureCards({ accentColor }: FeatureCardsProps) {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {features.map((feature) => {
                const Icon = feature.icon;
                return (
                    <div
                        key={feature.title}
                        className="group bg-white border border-black/[0.06] rounded-[14px] p-6 md:p-7 space-y-3 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                        <div
                            className="w-12 h-12 rounded-[10px] flex items-center justify-center mx-auto transition-transform duration-200 group-hover:scale-105"
                            style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 10%, transparent)` }}
                        >
                            <Icon className="w-5 h-5" style={{ color: accentColor }} />
                        </div>
                        <h3 className="font-semibold text-sm tracking-tight">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                );
            })}
        </section>
    );
}

'use client';

import { useSeason } from '@/contexts/season-context';
import { ChevronDown, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function SeasonSelector() {
    const { seasons, selectedSeason, setSelectedSeason, loading } = useSeason();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading || !selectedSeason) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>読み込み中...</span>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
            >
                <Calendar className="w-4 h-4 text-primary" />
                <span>{selectedSeason.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 right-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[120px]">
                    {seasons.map((season) => (
                        <button
                            key={season.id}
                            onClick={() => {
                                setSelectedSeason(season);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between ${selectedSeason.id === season.id ? 'bg-primary/10 text-primary font-medium' : ''
                                }`}
                        >
                            <span>{season.name}</span>
                            {season.is_current && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                    現在
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

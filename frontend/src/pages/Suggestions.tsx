import { useAlbumSuggestions } from '@/hooks/useApi';
import { SuggestionCard } from '@/components/SuggestionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Suggestions() {
    const { data: suggestions, isLoading, refetch, isRefetching } = useAlbumSuggestions();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold flex items-center gap-3">
                        <Sparkles className="h-8 w-8 text-yellow-500" />
                        AI Suggestions
                    </h1>
                    <p className="text-neutral-400 mt-1">
                        Smart album ideas based on your photo collection
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    disabled={isLoading || isRefetching}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                    Refresh Ideas
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-8 w-3/4 bg-neutral-800" />
                            <div className="grid grid-cols-2 gap-2">
                                {[1, 2, 3, 4].map(j => (
                                    <Skeleton key={j} className="aspect-square bg-neutral-800 rounded-md" />
                                ))}
                            </div>
                            <Skeleton className="h-10 w-full bg-neutral-800" />
                        </div>
                    ))}
                </div>
            ) : suggestions && suggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {suggestions.map((title) => (
                        <SuggestionCard key={title} title={title} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-neutral-900 rounded-lg border border-neutral-800">
                    <Sparkles className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No suggestions available</h2>
                    <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                        Try uploading more varied photos or click Refresh to generate new ideas.
                    </p>
                    <Button onClick={() => refetch()}>Try Again</Button>
                </div>
            )}
        </div>
    );
}
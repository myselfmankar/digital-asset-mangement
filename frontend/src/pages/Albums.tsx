import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { AlbumSummary } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Image as ImageIcon } from 'lucide-react';

export function Albums() {
    const navigate = useNavigate();

    const { data: albums, isLoading } = useQuery<AlbumSummary[]>({
        queryKey: ['albums', 'summary'],
        queryFn: () => apiClient.albums.summary(),
    });

    // Group albums by year
    const albumsByYear = albums?.reduce((acc, album) => {
        if (!acc[album.year]) {
            acc[album.year] = [];
        }
        acc[album.year].push(album);
        return acc;
    }, {} as Record<number, AlbumSummary[]>) || {};

    const years = Object.keys(albumsByYear)
        .map(Number)
        .sort((a, b) => b - a); // Newest first

    const getMonthName = (month: number) => {
        return new Date(2000, month - 1).toLocaleDateString('en-US', { month: 'long' });
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">Albums</h1>
                    <p className="text-neutral-400 mt-1">Browse your photos organized by date</p>
                </div>
                <div className="space-y-8">
                    {[1, 2].map((i) => (
                        <div key={i}>
                            <Skeleton className="h-8 w-24 mb-4 bg-neutral-800" />
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((j) => (
                                    <Skeleton key={j} className="h-48 bg-neutral-800" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!albums || albums.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">Albums</h1>
                    <p className="text-neutral-400 mt-1">Browse your photos organized by date</p>
                </div>
                <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-2">No albums yet</p>
                    <p className="text-sm text-neutral-600">Upload some photos to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold">Albums</h1>
                {albums && albums.length > 0 && (
                    <p className="text-neutral-400 mt-1">
                        {albums.reduce((sum, album) => sum + album.image_count, 0)} photos across {albums.length} albums
                    </p>
                )}
            </div>

            <div className="space-y-12">
                {years.map((year) => (
                    <div key={year}>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-blue-500" />
                            {year}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {albumsByYear[year]
                                .sort((a, b) => b.month - a.month)
                                .map((album) => (
                                    <Card
                                        key={`${album.year}-${album.month}`}
                                        className="bg-neutral-900 border-neutral-800 cursor-pointer transition-all duration-300 hover:border-neutral-700 hover:shadow-lg hover:shadow-neutral-900/50 group"
                                        onClick={() => navigate(`/albums/${album.year}/${album.month}`)}
                                    >
                                        <CardContent className="p-0">
                                            <div className="aspect-square bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                                                {album.preview_image_url ? (
                                                    <img src={album.preview_image_url} alt={`${getMonthName(album.month)} ${album.year}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                ) : (
                                                    <ImageIcon className="h-16 w-16 text-neutral-600 group-hover:text-neutral-500 transition-colors" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                                    <h3 className="font-semibold text-lg text-white">
                                                        {getMonthName(album.month)}
                                                    </h3>
                                                    <p className="text-sm text-neutral-300">
                                                        {album.image_count} photo{album.image_count !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

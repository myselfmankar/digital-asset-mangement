import { useState } from 'react';
import { useSearchAI, useCreateAlbum, useAddImagesToAlbum } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SuggestionCardProps {
    title: string;
}

export function SuggestionCard({ title }: SuggestionCardProps) {
    const { data: images, isLoading } = useSearchAI(title, true);
    const createAlbumMutation = useCreateAlbum();
    const addImagesMutation = useAddImagesToAlbum();
    const { toast } = useToast();
    const [isCreated, setIsCreated] = useState(false);

    const handleCreateAlbum = async () => {
        if (!images || images.length === 0) return;

        try {
            // 1. Create Album
            const album = await createAlbumMutation.mutateAsync({ name: title });
            
            // 2. Add Images
            await addImagesMutation.mutateAsync({
                albumId: album.id,
                imageIds: images.map(img => img.id)
            });

            setIsCreated(true);
            toast({ description: `Album "${title}" created with ${images.length} photos` });
        } catch (error) {
            toast({ 
                description: 'Failed to create album', 
                variant: 'destructive' 
            });
        }
    };

    const isProcessing = createAlbumMutation.isPending || addImagesMutation.isPending;

    return (
        <Card className="bg-neutral-900 border-neutral-800 overflow-hidden flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 min-h-[160px]">
                {isLoading ? (
                    <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="aspect-square bg-neutral-800 rounded-md" />
                        ))}
                    </div>
                ) : images && images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {images.slice(0, 4).map((image) => (
                            <div key={image.id} className="aspect-square relative overflow-hidden rounded-md group">
                                <img 
                                    src={image.thumbnail_url || image.medium_url || image.filepath} 
                                    alt={image.filename}
                                    className="object-cover w-full h-full transition-transform group-hover:scale-110"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                        No matching photos found
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2">
                <Button 
                    className="w-full" 
                    variant={isCreated ? "secondary" : "default"}
                    onClick={handleCreateAlbum}
                    disabled={isCreated || isProcessing || !images || images.length === 0}
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isCreated ? (
                        <Check className="h-4 w-4 mr-2" />
                    ) : (
                        <Plus className="h-4 w-4 mr-2" />
                    )}
                    {isProcessing ? 'Creating...' : isCreated ? 'Created' : 'Create Album'}
                </Button>
            </CardFooter>
        </Card>
    );
}

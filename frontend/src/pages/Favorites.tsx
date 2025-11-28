import { useCallback, useState, useMemo } from 'react';
import { useImages, useToggleFavorite, useDeleteImage } from '@/hooks/useApi';
import { ImageCard } from '@/components/ImageCard';
import { MasonryGrid } from '@/components/MasonryGrid';
import { ImageSkeletonGrid } from '@/components/ImageSkeleton';
import { ImageDetailsModal } from '@/components/ImageDetailsModal';
import { Image as ImageType } from '@/types';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Favorites() {
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);
    const [favoriteOptimistic, setFavoriteOptimistic] = useState<Set<number>>(new Set());
    const { toast } = useToast();

    const {
        data,
        isLoading,
        error,
    } = useImages();

    const deleteMutation = useDeleteImage();
    const favoriteMutation = useToggleFavorite();

    // Filter for favorites
    const favoriteImages = useMemo(() => {
        const allImages = data?.pages.flatMap((page) => page) || [];
        return allImages.filter((img) => img.is_favorite || favoriteOptimistic.has(img.id));
    }, [data, favoriteOptimistic]);

    const handleDelete = useCallback(async () => {
        if (!imageToDelete) return;

        try {
            await deleteMutation.mutateAsync(imageToDelete);
            toast({ description: 'Image deleted successfully' });
            setImageToDelete(null);
            if (selectedImage?.id === imageToDelete) {
                setSelectedImage(null);
            }
        } catch (error) {
            toast({
                description: 'Failed to delete image',
                variant: 'destructive',
            });
        }
    }, [imageToDelete, deleteMutation, selectedImage, toast]);

    const handleFavoriteToggle = useCallback(
        async (id: number) => {
            const newFavorites = new Set(favoriteOptimistic);
            const wasFavorite = newFavorites.has(id);

            if (wasFavorite) {
                newFavorites.delete(id);
            } else {
                newFavorites.add(id);
            }
            setFavoriteOptimistic(newFavorites);

            try {
                await favoriteMutation.mutateAsync(id);
            } catch (error) {
                const revertFavorites = new Set(favoriteOptimistic);
                if (wasFavorite) {
                    revertFavorites.add(id);
                } else {
                    revertFavorites.delete(id);
                }
                setFavoriteOptimistic(revertFavorites);
                toast({
                    description: 'Failed to update favorite',
                    variant: 'destructive',
                });
            }
        },
        [favoriteMutation, favoriteOptimistic, toast]
    );

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-red-500 mb-2">Error loading favorites</h2>
                    <p className="text-neutral-400 mb-4">
                        {error instanceof Error ? error.message : 'Something went wrong'}
                    </p>
                    <Button onClick={() => window.location.reload()}>Reload</Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">Favorites</h1>
                    <p className="text-neutral-400 mt-1">Your favorite photos in one place</p>
                </div>
                <ImageSkeletonGrid />
            </div>
        );
    }

    if (favoriteImages.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">Favorites</h1>
                    <p className="text-neutral-400 mt-1">Your favorite photos in one place</p>
                </div>

                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-900 mb-6">
                        <Heart className="h-10 w-10 text-neutral-600" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
                    <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                        Start marking your favorite photos by clicking the heart icon on any image
                    </p>
                    <Button onClick={() => navigate('/')}>
                        Browse Gallery
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold flex items-center gap-3">
                    <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                    Favorites
                </h1>
                <p className="text-neutral-400 mt-1">
                    {favoriteImages.length} favorite photo{favoriteImages.length !== 1 ? 's' : ''}
                </p>
            </div>

            <MasonryGrid>
                {favoriteImages.map((image) => (
                    <ImageCard
                        key={image.id}
                        image={image}
                        onClick={() => setSelectedImage(image)}
                        onFavoriteToggle={handleFavoriteToggle}
                        onDelete={(id) => setImageToDelete(id)}
                        isFavorite={true}
                    />
                ))}
            </MasonryGrid>

            <ImageDetailsModal
                image={selectedImage}
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                onFavoriteToggle={handleFavoriteToggle}
                onDelete={(id) => setImageToDelete(id)}
                isFavorite={true}
            />

            <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
                <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                    <AlertDialogTitle>Delete image</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this image? This action cannot be undone.
                    </AlertDialogDescription>
                    <div className="flex gap-3 justify-end">
                        <AlertDialogCancel className="bg-neutral-800 hover:bg-neutral-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

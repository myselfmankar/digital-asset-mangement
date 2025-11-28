import { useState, useCallback } from 'react';
import { useDuplicateImageGroups, useBatchDeleteImages, useToggleFavorite } from '@/hooks/useApi';
import { ImageCard } from '@/components/ImageCard';
import { ImageSkeletonGrid } from '@/components/ImageSkeleton';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash2, ShieldQuestion, RefreshCw } from 'lucide-react';

export function Duplicates() {
    const { data: duplicateGroups, isLoading, refetch } = useDuplicateImageGroups();
    const batchDeleteMutation = useBatchDeleteImages();
    const toggleFavoriteMutation = useToggleFavorite(); // For individual image actions
    const { toast } = useToast();

    const [imageToDelete, setImageToDelete] = useState<number | null>(null); // For individual delete in modal
    const [groupToDelete, setGroupToDelete] = useState<number[] | null>(null); // For deleting a whole group
    const [keepImageId, setKeepImageId] = useState<number | null>(null); // To keep one image in a group
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const handleDeleteIndividual = useCallback(async (id: number) => {
        setImageToDelete(id);
        setShowDeleteConfirmation(true);
    }, []);

    const handleConfirmDeleteIndividual = useCallback(async () => {
        if (!imageToDelete) return;
        try {
            await batchDeleteMutation.mutateAsync([imageToDelete]);
            toast({ description: 'Image deleted successfully.' });
            refetch();
            setImageToDelete(null);
            setShowDeleteConfirmation(false);
        } catch (error) {
            toast({ description: 'Failed to delete image.', variant: 'destructive' });
        }
    }, [imageToDelete, batchDeleteMutation, refetch, toast]);

    const handleDeleteGroup = useCallback(async (groupIds: number[], keepId?: number) => {
        setGroupToDelete(groupIds.filter(id => id !== keepId));
        setKeepImageId(keepId || null);
        setShowDeleteConfirmation(true);
    }, []);

    const handleConfirmDeleteGroup = useCallback(async () => {
        if (!groupToDelete || groupToDelete.length === 0) return;

        try {
            await batchDeleteMutation.mutateAsync(groupToDelete);
            toast({ description: `${groupToDelete.length} duplicate(s) deleted.` });
            refetch();
            setGroupToDelete(null);
            setKeepImageId(null);
            setShowDeleteConfirmation(false);
        } catch (error) {
            toast({ description: 'Failed to delete duplicates.', variant: 'destructive' });
        }
    }, [groupToDelete, batchDeleteMutation, refetch, toast]);

    const handleToggleFavorite = useCallback(async (id: number) => {
        try {
            await toggleFavoriteMutation.mutateAsync(id);
            toast({ description: 'Favorite status updated.' });
            refetch();
        } catch (error) {
            toast({ description: 'Failed to update favorite status.', variant: 'destructive' });
        }
    }, [toggleFavoriteMutation, refetch, toast]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-semibold mb-8">Duplicate Images</h1>
                <ImageSkeletonGrid />
            </div>
        );
    }

    if (!duplicateGroups || duplicateGroups.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">Duplicate Images</h1>
                    <p className="text-neutral-400 mt-1">Identify and manage identical photos</p>
                </div>
                <div className="text-center py-16 bg-neutral-900 rounded-lg border border-neutral-800">
                    <Copy className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No duplicate images found</h2>
                    <p className="text-neutral-500 max-w-md mx-auto">
                        We couldn't find any exact duplicates in your collection.
                    </p>
                    <Button onClick={() => refetch()} className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Scan Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold flex items-center gap-3">
                    <Copy className="h-8 w-8 text-blue-500" />
                    Duplicate Images
                </h1>
                <p className="text-neutral-400 mt-1">
                    Found {duplicateGroups.length} group{duplicateGroups.length !== 1 ? 's' : ''} of duplicates
                </p>
            </div>

            <div className="space-y-12">
                {duplicateGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Duplicate Group {groupIndex + 1}</h2>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.map(img => img.id))}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete All
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {group.map((image) => (
                                <ImageCard
                                    key={image.id}
                                    image={image}
                                    onDelete={handleDeleteIndividual}
                                    onFavoriteToggle={handleToggleFavorite}
                                    isFavorite={image.is_favorite}
                                    onClick={() => { /* Consider showing a modal with compare view */ }}
                                />
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-neutral-400">
                                Found {group.length} exact duplicate{group.length !== 1 ? 's' : ''} of this image.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteGroup(group.map(img => img.id), group[0].id)}
                                >
                                    <ShieldQuestion className="h-4 w-4 mr-2" />
                                    Keep One & Delete Others
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
                <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                    <AlertDialogTitle>
                        {groupToDelete ? `Delete ${groupToDelete.length} Duplicates?` : 'Delete Image?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {groupToDelete ?
                            `This action will permanently delete ${groupToDelete.length} selected duplicate(s) from your collection.` :
                            'Are you sure you want to delete this image? This action cannot be undone.'
                        }
                        {keepImageId && ` The image with ID ${keepImageId} will be kept.`}
                    </AlertDialogDescription>
                    <div className="flex gap-3 justify-end">
                        <AlertDialogCancel className="bg-neutral-800 hover:bg-neutral-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={groupToDelete ? handleConfirmDeleteGroup : handleConfirmDeleteIndividual}
                            disabled={batchDeleteMutation.isPending}
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

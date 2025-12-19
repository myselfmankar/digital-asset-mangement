import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { MapMarker, Image as ImageType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Maximize2 } from 'lucide-react';
import { ImageDetailsModal } from '@/components/ImageDetailsModal';
import { useToggleFavorite, useDeleteImage } from '@/hooks/useApi';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button'; // Added Button import
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom control to fit all markers in view
function FitBoundsControl({ markers }: { markers: MapMarker[] }) {
    const map = useMap();

    const handleFitBounds = () => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(
                markers.map(m => [m.latitude, m.longitude] as [number, number])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    };

    return (
        <div className="leaflet-top leaflet-right" style={{ marginTop: '80px', marginRight: '10px' }}>
            <div className="leaflet-control leaflet-bar">
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleFitBounds}
                    className="bg-white hover:bg-gray-100 text-gray-800 shadow-md flex items-center gap-1"
                    title="Fit all markers in view"
                >
                    <Maximize2 className="h-4 w-4" />
                    Fit All
                </Button>
            </div>
        </div>
    );
}

export function MapView() {
    const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);
    const [favoriteOptimistic, setFavoriteOptimistic] = useState<Set<number>>(new Set());

    const { data: markers, isLoading } = useQuery<MapMarker[]>({
        queryKey: ['map', 'data'],
        queryFn: () => apiClient.map.data(),
    });

    const deleteMutation = useDeleteImage();
    const favoriteMutation = useToggleFavorite();

    const handleDelete = async () => {
        if (!imageToDelete) return;
        try {
            await deleteMutation.mutateAsync(imageToDelete);
            // Refresh map data or remove marker client-side
            // For now, simply clear the image to be deleted
            setImageToDelete(null);
            setSelectedImage(null); // Close modal if the image being deleted is open
        } catch (error) {
            console.error("Error deleting image:", error);
            // Handle error, maybe show a toast
        }
    };

    const handleFavoriteToggle = async (id: number) => {
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
            console.error("Failed to update favorite", error);
            // toast({ description: 'Failed to update favorite', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">Map</h1>
                    <p className="text-neutral-400 mt-1">Explore your photos on an interactive map</p>
                </div>
                <Skeleton className="h-[600px] bg-neutral-800 rounded-lg" />
            </div>
        );
    }

    if (!markers || markers.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">Map</h1>
                    <p className="text-neutral-400 mt-1">Explore your photos on an interactive map</p>
                </div>
                <div className="text-center py-16 bg-neutral-900 rounded-lg border border-neutral-800">
                    <MapPin className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No geotagged photos</h2>
                    <p className="text-neutral-500 max-w-md mx-auto">
                        Upload photos with GPS location data to see them on the map
                    </p>
                </div>
            </div>
        );
    }

    const center: [number, number] = markers.length > 0
        ? [markers[0].latitude, markers[0].longitude]
        : [0, 0];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-blue-500" />
                    Map
                </h1>
                <p className="text-neutral-400 mt-1">
                    {markers.length} geotagged photo{markers.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="h-[600px] w-full rounded-lg overflow-hidden border border-neutral-800 relative">
                <MapContainer
                    center={center}
                    zoom={6}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                    style={{ background: '#1a1a1a' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MarkerClusterGroup
                        chunkedLoading
                        maxClusterRadius={60}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick={true}
                        iconCreateFunction={(cluster: any) => {
                            const count = cluster.getChildCount();
                            let size = 'small';
                            let bgColor = 'rgba(59, 130, 246, 0.6)'; // blue-500

                            if (count > 50) {
                                size = 'large';
                                bgColor = 'rgba(239, 68, 68, 0.6)'; // red-500
                            } else if (count > 20) {
                                size = 'medium';
                                bgColor = 'rgba(168, 85, 247, 0.6)'; // purple-500
                            } else if (count > 10) {
                                size = 'small';
                                bgColor = 'rgba(59, 130, 246, 0.6)'; // blue-500
                            } else {
                                bgColor = 'rgba(34, 197, 94, 0.6)'; // green-500
                            }

                            const sizeClass = size === 'large' ? 50 : size === 'medium' ? 40 : 35;

                            return L.divIcon({
                                html: `<div style="
                                    background: ${bgColor};
                                    backdrop-filter: blur(8px);
                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 50%;
                                    width: ${sizeClass}px;
                                    height: ${sizeClass}px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: white;
                                    font-weight: bold;
                                    font-size: ${size === 'large' ? '16px' : '14px'};
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                                ">${count}</div>`,
                                className: 'custom-cluster-icon',
                                iconSize: L.point(sizeClass, sizeClass, true),
                            });
                        }}
                    >
                        {markers.map((marker) => (
                            <Marker
                                key={marker.id}
                                position={[marker.latitude, marker.longitude]}
                                eventHandlers={{
                                    click: () => { /* No direct action on marker click for now */ }
                                }}
                            >
                                <Popup>
                                    <div className="flex flex-col items-center p-2">
                                        {marker.thumbnail_url && (
                                            <img
                                                src={marker.thumbnail_url}
                                                alt={marker.filename}
                                                className="w-24 h-24 object-cover rounded mb-2"
                                            />
                                        )}
                                        <p className="text-sm font-medium mb-1 truncate w-full text-center">{marker.filename}</p>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => setSelectedImage(marker as unknown as ImageType)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                    <FitBoundsControl markers={markers} />
                </MapContainer>
            </div>

            {/* Image Details Modal */}
            {selectedImage && (
                <ImageDetailsModal
                    image={selectedImage}
                    isOpen={!!selectedImage}
                    onClose={() => setSelectedImage(null)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onDelete={(id) => setImageToDelete(id)}
                    isFavorite={favoriteOptimistic.has(selectedImage.id) || selectedImage.is_favorite}
                />
            )}

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

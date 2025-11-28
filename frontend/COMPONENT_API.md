# Component API Reference

## Core Components

### ImageCard
Displays an image thumbnail with hover effects and quick actions.

**Location:** `src/components/ImageCard.tsx`

**Props:**
```typescript
interface ImageCardProps {
  image: Image                              // Image data object
  onClick?: () => void                      // Called when card clicked
  onFavoriteToggle?: (id: number) => void   // Called when favorite button clicked
  onDelete?: (id: number) => void           // Called when delete selected
  isFavorite?: boolean                      // Override favorite state
  isLoading?: boolean                       // Show disabled state
  className?: string                        // Additional CSS classes
}
```

**Features:**
- Responsive aspect square ratio
- Hover effects with gradient overlay
- Filename display on hover
- Favorite and menu buttons
- Tag badges
- Processing status indicator

### ImageDetailsModal
Full-screen modal for viewing image details and metadata.

**Location:** `src/components/ImageDetailsModal.tsx`

**Props:**
```typescript
interface ImageDetailsModalProps {
  image: Image | null                       // Image to display
  isOpen: boolean                           // Modal visibility
  onClose: () => void                       // Called when closing
  onFavoriteToggle?: (id: number) => void   // Favorite button callback
  onDelete?: (id: number) => void           // Delete button callback
  isFavorite?: boolean                      // Override favorite state
  isLoading?: boolean                       // Disable buttons during action
}
```

**Features:**
- Large image display
- Full EXIF metadata
- Tags and albums display
- Favorite, download, delete buttons
- Image information (resolution, size, date)
- Keyboard accessible
- Click outside to close

### MasonryGrid
CSS-based masonry layout component.

**Location:** `src/components/MasonryGrid.tsx`

**Props:**
```typescript
interface MasonryGridProps {
  children: ReactNode                       // Grid items
  className?: string                        // Additional classes
  gap?: 'xs' | 'sm' | 'md' | 'lg'          // Gap between items (default: 'md')
}
```

**Features:**
- CSS columns for better performance
- Responsive (1-5 columns)
- Automatic height calculation
- Smooth animations

### ImageSkeleton
Loading placeholder component.

**Location:** `src/components/ImageSkeleton.tsx`

**Features:**
- Single skeleton component
- Grid of skeletons (ImageSkeletonGrid)
- Matches ImageCard dimensions
- Animated loading effect

### Navigation
Fixed header navigation component.

**Location:** `src/components/Navigation.tsx`

**Features:**
- Sticky positioning
- Links to all main pages
- Active state indication
- Mobile responsive (icons only on mobile)
- Backdrop blur effect

### Layout
Main layout wrapper with navigation and outlet.

**Location:** `src/components/Layout.tsx`

**Features:**
- Navigation integration
- Route outlet
- Fixed navigation spacing
- Dark background

## Page Components

### Gallery
Main gallery page with infinite scroll.

**Location:** `src/pages/Gallery.tsx`

**Features:**
- Masonry grid layout
- Infinite scroll pagination
- Image cards with actions
- Image details modal
- Delete confirmation
- Favorite toggle with optimistic updates
- Error state with retry
- Empty state

### Search
AI-powered search page.

**Location:** `src/pages/Search.tsx`

**Features:**
- Search input with form
- Real-time AI search
- Results in masonry grid
- Same image card actions as gallery
- Search query display
- Empty and loading states

### Upload
Drag-and-drop file upload page.

**Location:** `src/pages/Upload.tsx`

**Features:**
- Drag-and-drop zone
- File input fallback
- File validation
- Upload queue management
- Progress bars per file
- Batch upload
- Error handling

### Stats
Statistics and analytics page.

**Location:** `src/pages/Stats.tsx`

**Features:**
- Summary cards (4 key metrics)
- Monthly upload trends chart
- Storage breakdown visualization
- Responsive grid layout

## Hooks

### useImages
Infinite query for fetching images with pagination.

**Location:** `src/hooks/useApi.ts`

```typescript
const {
  data,              // Pages array of images
  fetchNextPage,     // Function to fetch next page
  hasNextPage,       // Boolean - are there more pages
  isFetchingNextPage,// Boolean - currently fetching
  isLoading,         // Boolean - initial load
  error              // Error object if any
} = useImages(sortBy = 'upload_date', enabled = true)
```

### useUploadImage
Mutation for uploading a single image.

```typescript
const {
  mutateAsync,       // Async function to upload
  isPending,         // Boolean - upload in progress
  error              // Error object if any
} = useUploadImage()
```

### useDeleteImage
Mutation for deleting an image.

```typescript
const {
  mutateAsync,       // Async function to delete
  isPending,         // Boolean - delete in progress
  error              // Error object if any
} = useDeleteImage()
```

### useToggleFavorite
Mutation for toggling favorite status.

```typescript
const {
  mutateAsync,       // Async function to toggle
  isPending,         // Boolean - toggle in progress
  error              // Error object if any
} = useToggleFavorite()
```

### useSearchAI
Query for AI-powered search.

```typescript
const {
  data,              // Array of matching images
  isLoading,         // Boolean - searching
  isFetching,        // Boolean - background fetch
  error              // Error object if any
} = useSearchAI(query = '', enabled = false)
```

### useAlbumSummary
Query for album summary.

```typescript
const {
  data,              // Array of album summaries
  isLoading,         // Boolean - loading
  error              // Error object if any
} = useAlbumSummary()
```

### useAlbumImages
Query for images in specific album.

```typescript
const {
  data,              // Array of images
  isLoading,         // Boolean - loading
  error              // Error object if any
} = useAlbumImages(year, month)
```

### useCameraFilters
Query for available camera models.

```typescript
const {
  data,              // Array of camera names
  isLoading,         // Boolean - loading
  error              // Error object if any
} = useCameraFilters()
```

### useLocationFilters
Query for available locations.

```typescript
const {
  data,              // Array of location names
  isLoading,         // Boolean - loading
  error              // Error object if any
} = useLocationFilters()
```

### useDateFilters
Query for available dates.

```typescript
const {
  data,              // Array of date strings
  isLoading,         // Boolean - loading
  error              // Error object if any
} = useDateFilters()
```

### useMapData
Query for geotagged image data.

```typescript
const {
  data,              // Array of map markers
  isLoading,         // Boolean - loading
  error              // Error object if any
} = useMapData()
```

### useStats
Query for collection statistics.

```typescript
const {
  data,              // Stats object
  isLoading,         // Boolean - loading
  error              // Error object if any
} = useStats()
```

### useToast
Hook for displaying toast notifications.

```typescript
const { toast } = useToast()

toast({
  description: 'Message text',
  variant: 'default' | 'destructive'  // Optional
})
```

## Types

All types are defined in `src/types/index.ts`:

- **Image** - Full image object with metadata
- **Metadata** - EXIF and image metadata
- **Location** - Geographic location data
- **Tag** - Image tag
- **AlbumBase** - Album information
- **AIQuery** - AI search query
- **Stats** - Collection statistics
- **MapMarker** - Map marker data

## Utility Functions

### API Client
Located in `src/lib/api.ts`, provides:

```typescript
apiClient.images.list(skip, limit, sortBy)
apiClient.images.delete(id)
apiClient.images.toggleFavorite(id)
apiClient.uploadImage(file)
apiClient.search.ai(query)
apiClient.albums.summary()
apiClient.albums.getImages(year, month)
apiClient.filters.cameras()
apiClient.filters.locations()
apiClient.filters.dates()
apiClient.map.data()
apiClient.stats.get()
apiClient.suggestions.albums()
```

### Query Client
Located in `src/lib/query-client.ts`:
- Configured with optimal defaults
- 5-minute stale time
- 30-minute garbage collection
- Single retry on failure
- No refetch on window focus

### Router
Located in `src/lib/router.tsx`:
- Browser router setup
- Route definitions
- Layout integration

## Using Components

### Example: Image Gallery with Details
```typescript
import { Gallery } from '@/pages/Gallery'

// In your route
<Route path="/" element={<Gallery />} />
```

### Example: Custom Image Card Usage
```typescript
import { ImageCard } from '@/components/ImageCard'
import { useToggleFavorite } from '@/hooks/useApi'

export function MyComponent() {
  const toggleMutation = useToggleFavorite()

  return (
    <ImageCard
      image={imageData}
      onClick={() => setSelected(imageData)}
      onFavoriteToggle={(id) => toggleMutation.mutateAsync(id)}
      onDelete={(id) => deleteImage(id)}
    />
  )
}
```

### Example: Using Search Hook
```typescript
import { useSearchAI } from '@/hooks/useApi'

export function SearchComponent() {
  const { data: results, isLoading } = useSearchAI(
    'sunset over mountains',
    true  // enabled
  )

  return (
    <MasonryGrid>
      {results?.map(img => <ImageCard key={img.id} image={img} />)}
    </MasonryGrid>
  )
}
```

All components are fully typed with TypeScript for excellent IDE support and type safety.

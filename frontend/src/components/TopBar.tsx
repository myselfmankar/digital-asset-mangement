import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Upload as UploadIcon, Info, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TopBarProps {
    onMenuClick?: () => void;
    showMenuButton?: boolean;
}

export function TopBar({ onMenuClick, showMenuButton }: TopBarProps) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const aiSuggestions = [
        "Photos of cats in a sunbeam",
        "Beach sunsets from last summer",
        "Pictures of my car",
        "Best food photos from 2023",
    ];

    return (
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80 z-40">
            <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
                {showMenuButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-neutral-400 hover:text-white"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}

                {/* Search Bar */}
                <Popover open={isSearchFocused} onOpenChange={setIsSearchFocused}>
                    <PopoverTrigger asChild>
                        <form onSubmit={handleSearch} className="flex-1 max-w-3xl">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                <Input
                                    type="text"
                                    placeholder="Search with AI... (e.g., 'sunset photos from last summer')"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    className="pl-10 bg-neutral-900 border-neutral-800 focus:border-neutral-700 h-10 w-full"
                                />
                            </div>
                        </form>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] bg-neutral-900 border-neutral-800 text-white mt-2">
                        <div className="p-2">
                            <h4 className="text-sm font-semibold text-neutral-400 mb-2">AI Suggestions</h4>
                            <ul className="space-y-1">
                                {aiSuggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        className="text-sm text-neutral-300 hover:bg-neutral-800 p-2 rounded cursor-pointer"
                                        onMouseDown={() => {
                                            setSearchQuery(suggestion);
                                            navigate(`/search?q=${encodeURIComponent(suggestion)}`);
                                        }}
                                    >
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Right Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-neutral-400 hover:text-white"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-neutral-900 border-neutral-800">
                        <DropdownMenuItem
                            onClick={() => navigate('/upload')}
                            className="cursor-pointer"
                        >
                            <UploadIcon className="h-4 w-4 mr-2" />
                            Upload Images
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-neutral-800" />
                        <DropdownMenuItem
                            onClick={() => navigate('/settings')}
                            className="cursor-pointer"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigate('/about')}
                            className="cursor-pointer"
                        >
                            <Info className="h-4 w-4 mr-2" />
                            About
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';

export default function ProductImageCarousel({ images, productName }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter out empty/null images just in case
    const validImages = images?.filter(img => img) || [];

    if (validImages.length === 0) {
        return (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                No Image
            </div>
        );
    }

    const handlePrev = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image Stage */}
            <div className="relative group rounded-2xl overflow-hidden shadow-sm border border-wood-100 bg-white p-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                    <img
                        src={getImageUrl(validImages[currentIndex])}
                        alt={`${productName} - ${currentIndex + 1}`}
                        className="w-full h-full object-cover transition-all duration-300"
                    />

                    {/* Arrows - Only show if > 1 image */}
                    {validImages.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-wood-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-wood-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Next image"
                            >
                                <ChevronRight size={24} />
                            </button>

                            {/* Dots Indicator */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {validImages.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full shadow-sm transition-all ${idx === currentIndex ? 'bg-white scale-110' : 'bg-white/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Thumbnail Navigation */}
            {validImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 px-1 snap-x scrollbar-hide">
                    {validImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all p-1 bg-white snap-start ${idx === currentIndex
                                    ? 'border-wood-600 ring-1 ring-wood-600'
                                    : 'border-transparent hover:border-wood-300'
                                }`}
                        >
                            <img
                                src={getImageUrl(img)}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover rounded-md"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client"

import { useState } from "react"
import VideoEmbed from "./VideoEmbed"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface VideoGridProps {
  videos: Array<{
    id: string
    url: string
    title?: string
    taggedActorNames?: string[]
  }>
  maxVisible?: number
  className?: string
  thumbnailOnly?: boolean
  onVideoClick?: (videoId: string) => void
}

export default function VideoGrid({
  videos,
  maxVisible = 4,
  className = "",
  thumbnailOnly = true,
  onVideoClick,
}: VideoGridProps) {
  const [showAll, setShowAll] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No videos available</p>
      </div>
    )
  }

  const visibleVideos = showAll ? videos : videos.slice(0, maxVisible)
  const hasMore = videos.length > maxVisible

  const handleVideoClick = (videoId: string) => {
    if (thumbnailOnly) {
      setSelectedVideo(selectedVideo === videoId ? null : videoId)
      onVideoClick?.(videoId)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleVideos.map((video) => (
          <div key={video.id} className="relative">
            <VideoEmbed
              url={video.url}
              title={video.title}
              thumbnailOnly={thumbnailOnly && selectedVideo !== video.id}
              className="w-full"
              onError={(error) => console.warn(`Video error for ${video.id}:`, error)}
            />

            {/* Tagged Actors Overlay */}
            {video.taggedActorNames && video.taggedActorNames.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                  Tagged: {video.taggedActorNames.join(", ")}
                </div>
              </div>
            )}

            {/* Click overlay for thumbnail mode */}
            {thumbnailOnly && (
              <div className="absolute inset-0 cursor-pointer" onClick={() => handleVideoClick(video.id)} />
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)} className="flex items-center gap-2">
            {showAll ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show {videos.length - maxVisible} More <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Video Count */}
      <div className="text-center text-sm text-slate-500">
        {videos.length} video{videos.length !== 1 ? "s" : ""} total
      </div>
    </div>
  )
}

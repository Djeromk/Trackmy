import type {
  ExternalBook,
  ExternalGame,
  ExternalMovie,
  MediaStatus,
  MediaType,
} from "@/types";
import {
  BOOKS_STATUS_LABELS,
  FILMS_STATUS_LABELS,
  STATUS_LABELS,
} from "@/types";

function getItemId(item: ExternalMovie | ExternalBook | ExternalGame): string {
  if ("id" in item && item.id != null) return String(item.id);
  return "";
}



function getTitle(item: ExternalMovie | ExternalBook | ExternalGame): string {
  if ("title" in item) return item.title;
  if ("name" in item) return item.name;
  return "";
}

function getImage(
  item: ExternalMovie | ExternalBook | ExternalGame,
): string | null {
  if ("thumbnail" in item && item.thumbnail) return item.thumbnail;
  //if ("thumbnail" in item) return item.thumbnail;
  //if ("background_image" in item) return item.background_image;
  return null;
}

function getSubtitle(
  item: ExternalMovie | ExternalBook | ExternalGame,
): string {
  if ("authors" in item && item.authors.length > 0) {
    return item.authors.join(", ");
  }
  return "";
}
function getMetacritic(item: ExternalGame): number {
  if ("metacritic" in item && item.metacritic) {
    return item.metacritic;
  }
  return 0;
}
function getReleaseDate(
  item: ExternalMovie | ExternalBook | ExternalGame,
): string {
  return ("year" in item ? item.year?.toString() ?? "" : "");
}

const STATUS_ICONS: Record<MediaStatus, string> = {
  backlog: "Archive",
  in_progress: "ClockFading",
  completed: "CircleCheckBig",
  dropped: "Archive",
};

export interface StatusOption {
  value: MediaStatus;
  label: string;
  icon: string;
}

function getSearchPlaceholder(mediaType: MediaType): string {
  const labels: Record<MediaType, string> = {
    movie: "Поиск фильмов...",
    book: "Поиск книг...",
    game: "Поиск игр...",
    other: "Поиск...",
  };
  return labels[mediaType] ?? labels.other;
}

function getAvailableStatuses(mediaType?: MediaType): StatusOption[] {
  const labels =
    mediaType === "book"
      ? BOOKS_STATUS_LABELS
      : mediaType === "movie"
        ? FILMS_STATUS_LABELS
        : STATUS_LABELS;
  return [
    { value: "backlog", label: labels.backlog, icon: "Archive" },
    { value: "in_progress", label: labels.in_progress, icon: "ClockFading" },
    { value: "completed", label: labels.completed, icon: "CircleCheckBig" },
  ];
}

function getStatusIcon(status: MediaStatus | null): string {
  return status ? STATUS_ICONS[status] ?? "Archive" : "Archive";
}

function getStatusLabel(mediaType: MediaType, status: MediaStatus | null): string {
  if (!status) return "";
  const options = getAvailableStatuses(mediaType);
  return options.find((s) => s.value === status)?.label ?? "";
}

function isCurrentStatus(
  result: { isAdded: boolean; currentStatus: MediaStatus | null },
  status: MediaStatus,
): boolean {
  return result.isAdded && result.currentStatus === status;
}

function createImageErrorHandler(fallbackSrc: string) {
  return (event: Event) => {
    const target = event.target as HTMLImageElement | null;
    if (target) target.src = fallbackSrc;
  };
}

export {
  getItemId,
 // availableStatuses,
  //alreadyAdded,
  //getExistingStatus,
  getTitle,
  getImage,
  getSubtitle,
  getMetacritic,
  getReleaseDate,
  getSearchPlaceholder,
  getAvailableStatuses,
  getStatusIcon,
  getStatusLabel,
  isCurrentStatus,
  createImageErrorHandler,
};

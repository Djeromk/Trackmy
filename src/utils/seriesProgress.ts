// src/utils/seriesUtils.ts

import type {
	KinopoiskTVSeason,
	WatchedEpisodesMap,
	SeriesProgress,
	SeasonProgress
  } from '@/types';

  export function calculateSeriesProgress(
	seasons: KinopoiskTVSeason[],
	watchedEpisodes: WatchedEpisodesMap
  ): SeriesProgress {
	const seasonProgress: SeasonProgress[] = seasons.map(season => {
	  const watched = watchedEpisodes[season.number.toString()] || [];
	  const total = season.episodes.length;

	  return {
		seasonNumber: season.number,
		totalEpisodes: total,
		watchedEpisodes: watched,
		watchedCount: watched.length,
		isCompleted: watched.length === total,
		completionPercentage: Math.round((watched.length / total) * 100)
	  };
	});

	const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodes.length, 0);
	const watchedCount = seasonProgress.reduce((sum, s) => sum + s.watchedCount, 0);
	const current = findCurrentEpisode(seasons, watchedEpisodes);

	return {
	  totalSeasons: seasons.length,
	  totalEpisodes,
	  watchedEpisodes: watchedCount,
	  completionPercentage: Math.round((watchedCount / totalEpisodes) * 100),
	  current_season: current.season,
	  current_episode: current.episode,
	  seasons: seasonProgress
	};
  }

  /**
   * Находит первую непросмотренную серию
   * Логика: последовательно проходит по сезонам и сериям
   */
  export function findCurrentEpisode(
	seasons: KinopoiskTVSeason[],
	watchedEpisodes: WatchedEpisodesMap
  ): { season: number | null; episode: number | null } {
	for (const season of seasons) {
	  const watched = watchedEpisodes[season.number.toString()] || [];

	  for (const episode of season.episodes) {
		if (!watched.includes(episode.episodeNumber)) {
		  return {
			season: season.number,
			episode: episode.episodeNumber
		  };
		}
	  }
	}

	// Все серии просмотрены
	return { season: null, episode: null };
  }

  export function markEpisodeWatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasonNumber: number,
	episodeNumber: number
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	const seasonKey = seasonNumber.toString();

	if (!updated[seasonKey]) {
	  updated[seasonKey] = [];
	}

	if (!updated[seasonKey].includes(episodeNumber)) {
	  updated[seasonKey] = [...updated[seasonKey], episodeNumber].sort((a, b) => a - b);
	}

	return updated;
  }

  export function markEpisodeUnwatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasonNumber: number,
	episodeNumber: number
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	const seasonKey = seasonNumber.toString();

	if (updated[seasonKey]) {
	  updated[seasonKey] = updated[seasonKey].filter(ep => ep !== episodeNumber);
	}

	return updated;
  }


  export function markSeasonWatched(
	watchedEpisodes: WatchedEpisodesMap,
	season: KinopoiskTVSeason
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	const seasonKey = season.number.toString();

	updated[seasonKey] = season.episodes.map(ep => ep.episodeNumber);
	console.log('updated', updated);
	return updated;
  }


  export function markSeasonUnwatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasonNumber: number
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	delete updated[seasonNumber.toString()];

	return updated;
  }

  export function markSeriesWatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasons: KinopoiskTVSeason[]
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	seasons.forEach(season => {
	  updated[season.number.toString()] = season.episodes.map(ep => ep.episodeNumber);
	});
	return updated;
	}


  export function isEpisodeWatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasonNumber: number,
	episodeNumber: number
  ): boolean {
	const watched = watchedEpisodes[seasonNumber.toString()] || [];
	return watched.includes(episodeNumber);
  }


  export function isSeasonWatched(
	watchedEpisodes: WatchedEpisodesMap,
	season: KinopoiskTVSeason
  ): boolean {
	const watched = watchedEpisodes[season.number.toString()] || [];
	return watched.length === season.episodes.length;
  }

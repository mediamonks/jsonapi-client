import { Type } from '../../../index'

export enum PageSlug {
  Landing = 'landing',
  AthleteDetail = 'athlete-detail',
  Athletes = 'athletes',
  CountryDetails = 'country-detail',
  Countries = 'countries',
  Medals = 'medals',
  Photos = 'photos',
  Search = 'search',
  Schedule = 'schedule',
  SportDetail = 'sport-detail',
  Sports = 'sports',
  TheGames = 'the-games',
  VideoArchive = 'video-archive',
  VideoLong = 'video-long',
  VideoShort = 'video-short',
  Watch = 'watch',
  Results = 'results',
}

export const pageSlug: Type<PageSlug> = Type.either(...Object.values(PageSlug))

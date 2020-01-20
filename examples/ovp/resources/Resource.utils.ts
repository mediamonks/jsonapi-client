import { isNumber, shape, Static } from 'isntnt';

export type OrganisationStatistics = Static<typeof isOrganisationStatistics>;

export const isOrganisationStatistics = shape({
  total: isNumber,
  gold: isNumber,
  silver: isNumber,
  bronze: isNumber,
  goldRank: isNumber,
  totalRank: isNumber,
  populationGoldRank: isNumber,
  populationTotalRank: isNumber,
  previousGoldRank: isNumber,
  previousTotalRank: isNumber,
});

export type DisciplineStatistics = Static<typeof isDisciplineStatistics>;

export const isDisciplineStatistics = shape({
  total: isNumber,
  gold: isNumber,
  silver: isNumber,
  bronze: isNumber,
});

import {
  asset,
  competitor,
  country,
  event,
  eventUnit,
  individual,
  medal,
  organisation,
  participant,
  phase,
  result,
  stage,
} from './resources'

const eventFilter = event.createQuery(
  {
    [event.type]: ['externalId', 'stages'] as const,
    [stage.type]: ['externalId', 'phases', 'competitors'] as const,
    [phase.type]: ['externalId', 'title', 'eventUnits'] as const,
    [eventUnit.type]: ['externalId', 'title', 'start', 'competitors', 'scheduleStatus'] as const,
    [competitor.type]: [
      'externalId',
      'extendedInfo',
      'order',
      'results',
      'participant',
      'medals',
    ] as const,
    [result.type]: [
      'resultType',
      'value',
      'diff',
      'status',
      'wlt',
      'rank',
      'extendedInfo',
      'totalValue',
      'qualificationMark',
      'sortOrder',
      'valueType',
      'irm',
      'pool',
    ] as const,
    [medal.type]: ['medalType'] as const,
    [participant.type]: [
      'participantType',
      'name',
      'individual',
      'participants',
      'organisation',
    ] as const,
    [individual.type]: ['fullGivenName', 'fullFamilyName', 'gender'] as const,
    [country.type]: ['iso2Code', 'iso3Code', 'iocCode', 'isoName', 'iocName'] as const,
    [asset.type]: ['source'] as const,
    [organisation.type]: ['externalId', 'flag', 'country'] as const,
  },
  {
    stages: {
      competitors: {
        medals: null,
        results: null,
        participant: {
          participants: null,
          individual: null,
          organisation: {
            country: null,
            flag: null,
          },
        },
      },
      phases: {
        eventUnits: {
          competitors: null,
        },
      },
    },
    competitors: {
      results: null,
      medals: null,
      participant: {
        individual: null,
        organisation: {
          country: null,
          flag: null,
        },
      },
    },
  },
)

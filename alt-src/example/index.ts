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
    [event.type]: ['externalId', 'stages', 'competitors'],
    [stage.type]: ['externalId', 'phases', 'competitors'],
    [phase.type]: ['externalId', 'title', 'eventUnits'],
    [eventUnit.type]: ['externalId', 'title', 'start', 'competitors', 'scheduleStatus'],
    [competitor.type]: ['externalId', 'extendedInfo', 'order', 'results', 'participant', 'medals'],
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
    ],
    [medal.type]: ['medalType'],
    [participant.type]: ['participantType', 'name', 'individual', 'participants', 'organisation'],
    [individual.type]: ['fullGivenName', 'fullFamilyName', 'gender'],
    [country.type]: ['iso2Code', 'iso3Code', 'iocCode', 'isoName', 'iocName'],
    [asset.type]: ['source'],
    [organisation.type]: ['externalId', 'flag', 'country'],
  },
  {
    stages: {
      competitors: {
        medals: true,
        results: true,
        participant: {
          participants: false,
          individual: true,
          organisation: {
            country: true,
            flag: true,
          },
        },
      },
      phases: {
        eventUnits: {
          competitors: true,
        },
      },
    },
    competitors: {
      results: false,
      medals: true,
      participant: {
        individual: true,
        organisation: {
          country: true,
          flag: true,
        },
      },
    },
  },
)

const eventIncludeFilter = eventFilter.include.competitors

import { FilteredResource } from '../'
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
    [medal.type]: ['medalType', 'event'],
    [participant.type]: ['participantType', 'name', 'individual', 'participants', 'organisation'],
    [individual.type]: ['fullGivenName', 'fullFamilyName', 'gender'],
    [country.type]: ['iso2Code', 'iso3Code', 'iocCode', 'isoName', 'iocName'],
    [asset.type]: ['source'],
    [organisation.type]: ['externalId', 'flag', 'country'],
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

const eventIncludeFilter = eventFilter.include

type X = FilteredResource<typeof event, typeof eventFilter>

const x = {} as X

type Y = X['stages'][number]['competitors'][number]['medals'][number]

console.log(x.stages[0].competitors[1].medals[0].event)

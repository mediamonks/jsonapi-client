import 'regenerator-runtime/runtime'
import { Client, ResourceFieldsQuery } from '../../../src'

import {
  competitor,
  event,
  stage,
  phase,
  eventUnit,
  result,
  medal,
  participant,
  individual,
  country,
  asset,
  organisation,
} from './resources'

const url = new URL(process.env.API_URL!)

const client = new Client(url, {
  beforeRequestHeaders(headers: Headers) {
    headers.set('X-OBS-App-Token', process.env.API_KEY!)
    return headers
  },
})

const eventEndpoint = client.endpoint('events', event)

const eventFilter = eventEndpoint.createFilter(
  // @ts-ignore
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

eventEndpoint
  .getOne('005307f1-9761-3210-9302-8d8bda7dc533', eventFilter)
  .then((eventResource) => {
    console.log(eventResource.stages[1].phases)
  })
  .catch(console.dir)

const eventFilterDiscipline = {
  fields: {
    [event.type]: ['stages'],
    [stage.type]: ['phases', 'startDate', 'endDate'],
  },
  include: {
    stages: null,
  },
} as const

eventEndpoint
  .getMany(null, eventFilterDiscipline)
  .then((manyEvents) => {
    console.log(manyEvents)
  })
  .catch(console.dir)

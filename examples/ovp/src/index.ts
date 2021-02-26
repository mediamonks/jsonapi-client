import 'regenerator-runtime/runtime'
import { Client, Resource } from '../../../src'

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

const eventFilterAlt = event.createFilter(
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
  .getOne('005307f1-9761-3210-9302-8d8bda7dc533', eventFilterAlt)
  .then((event) => {
    console.log(event.stages[1].phases[0].type)
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
  .then((events) => {
    console.log(events[1].stages)
  })
  .catch(console.dir)

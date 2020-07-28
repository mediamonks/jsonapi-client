import 'regenerator-runtime/runtime'
import jsonapi from '../../../src'

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

const client = jsonapi.client(url, {
  beforeRequestHeaders(headers: Headers) {
    headers.set('X-OBS-App-Token', process.env.API_KEY!)
    return headers
  },
} as any)

const eventEndpoint = client.endpoint('events', event)

const eventFilter = event.filter(
  {
    [event.type]: ['externalId', 'name', 'stages', 'competitors'],
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

// eventEndpoint.getOne('005307f1-9761-3210-9302-8d8bda7dc533', eventFilter).then((eventResource) => {
//   console.log(eventResource)
// })

eventEndpoint
  .getMany()
  .then((manyEvents) => {
    console.log(manyEvents)
  })
  .catch((error) => {
    console.dir(error)
  })

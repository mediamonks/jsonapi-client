import { event, stage } from './resources'

const x = event.createQuery(
  {
    [event.type]: ['name', 'externalId', 'stages'],
    [stage.type]: ['stageType', 'event'],
  },
  {
    stages: {
      event: true,
    },
  },
)

import { Type } from '../../../../../src'

export enum EventUnitScheduleStatus {
  None = '',
  Canceled = 'CANCELLED',
  Delayed = 'DELAYED',
  Finished = 'FINISHED',
  GettingReady = 'GETTING_READY',
  Interrupted = 'INTERRUPTED',
  Postponed = 'POSTPONED',
  Rescheduled = 'RESCHEDULED',
  Running = 'RUNNING',
  Scheduled = 'SCHEDULED',
  ScheduledBreak = 'SCHEDULED_BREAK',
  Unscheduled = 'UNSCHEDULED',
}

export const eventUnitScheduleStatus: Type<EventUnitScheduleStatus> = Type.either(
  ...Object.values(EventUnitScheduleStatus),
)

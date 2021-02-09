import { Type } from '../../../index'

export enum ScheduleSessionState {
  Unscheduled = 'UNSCHEDULED',
  Scheduled = 'SCHEDULED',
  PreLive = 'PRE_LIVE',
  Live = 'LIVE',
  Finished = 'FINISHED',
}

export const scheduleSessionState: Type<ScheduleSessionState> = Type.either(
  ...Object.values(ScheduleSessionState),
)

import { Type } from '../../../index'

export enum VODVideoType {
  FullEventReplay = 'FER',
  ShortForm = 'SHORT_FORM',
}

export const vodVideoType: Type<VODVideoType> = Type.either(...Object.values(VODVideoType))

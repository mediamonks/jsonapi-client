import { Type } from '../../../index'

export enum StageType {
  Brackets = 'BRACKETS',
  Pools = 'POOLS',
}

export const stageType: Type<StageType> = Type.either(...Object.values(StageType))

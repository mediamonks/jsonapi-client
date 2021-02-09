import { Type } from '../../../index'

export enum MedalType {
  Bronze = 'BRONZE',
  Silver = 'SILVER',
  Gold = 'GOLD',
}

export const medalType: Type<MedalType> = Type.either(...Object.values(MedalType))

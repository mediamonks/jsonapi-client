import { Type } from '../../../../../src'

export enum MedalType {
  Bronze = 'BRONZE',
  Silver = 'SILVER',
  Gold = 'GOLD',
}

export const medalType: Type<MedalType> = Type.either(...Object.values(MedalType))

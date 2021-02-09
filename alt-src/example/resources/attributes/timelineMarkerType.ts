import { Type } from '../../../index'

export enum TimelineMarkerType {
  /**
   * an alias for the 'moment' marker type
   * they are added as additional 'moment' markers via the CMS
   */
  Custom = 'custom',
  /**
   * specify a highlight in a session
   */
  Highlight = 'highlight',
  /**
   * specify the start of a chapter in a session
   */
  Chapter = 'chapter',
  /**
   * specifies when a participant starts their match/race/etc.
   */
  Participation = 'participation',
}

export const timelineMarkerType: Type<TimelineMarkerType> = Type.either(
  ...Object.values(TimelineMarkerType),
)

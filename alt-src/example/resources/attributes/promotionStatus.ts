import { Type } from '../../../index'

export enum PromotionStatus {
  NotPromoted = 'NOT_PROMOTED',
  AwaitingPromotion = 'AWAITING_PROMOTION', // Up for promotion
  HandlingPromotion = 'HANDLING_PROMOTION', // Promotion is added to queue
  PromotionFailed = 'PROMOTION_FAILED', // Promotion has failed
  AwaitingApproval = 'AWAITING_APPROVAL', // Promotion is awaiting approval
  Promoted = 'PROMOTED', // Promotion has been approved, VOD{ vodType: 'FER' } is now available
}

export const promotionStatus: Type<PromotionStatus> = Type.either(...Object.values(PromotionStatus))

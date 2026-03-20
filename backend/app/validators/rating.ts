import vine from '@vinejs/vine'

export const rateTrackValidator = vine.compile(
  vine.object({
    rating: vine.number().withoutDecimals().range([1, 5]),
  })
)

import vine from '@vinejs/vine'

export const favoriteTrackValidator = vine.compile(
  vine.object({
    track_id: vine.number().withoutDecimals().positive(),
  })
)

export const favoriteArtistValidator = vine.compile(
  vine.object({
    artist_id: vine.number().withoutDecimals().positive(),
  })
)

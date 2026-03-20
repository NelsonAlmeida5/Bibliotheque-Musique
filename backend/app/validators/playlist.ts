import vine from '@vinejs/vine'

export const createPlaylistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(150),
    description: vine.string().maxLength(255).optional(),
  })
)

export const updatePlaylistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(150).optional(),
    description: vine.string().maxLength(255).optional(),
  })
)

export const addTrackToPlaylistValidator = vine.compile(
  vine.object({
    track_id: vine.number().withoutDecimals().positive(),
  })
)

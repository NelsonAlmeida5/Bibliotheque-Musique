import vine from '@vinejs/vine'

export const createArtistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(150),
    image_url: vine.string().maxLength(1000).optional(),
    description: vine.string().maxLength(255).optional(),
  })
)

export const updateArtistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(150).optional(),
    image_url: vine.string().maxLength(1000).optional(),
    description: vine.string().maxLength(255).optional(),
  })
)

import vine from '@vinejs/vine'

export const createTrackValidator = vine.compile(
  vine.object({
    title: vine.string().minLength(2).maxLength(150),
    embed_url: vine.string().maxLength(1000),
    cover_url: vine.string().maxLength(1000).optional(),
    description: vine.string().maxLength(1000).optional(),

    artist_id: vine.number().withoutDecimals().positive().optional(),
    category_id: vine.number().withoutDecimals().positive().optional(),

    custom_artist_name: vine.string().minLength(2).maxLength(150).optional(),
    custom_category_name: vine.string().minLength(2).maxLength(150).optional(),

    is_public: vine.boolean().optional(),
  })
)

export const updateTrackValidator = vine.compile(
  vine.object({
    title: vine.string().minLength(2).maxLength(150).optional(),
    embed_url: vine.string().maxLength(1000).optional(),
    cover_url: vine.string().maxLength(1000).optional(),
    description: vine.string().maxLength(1000).optional(),

    artist_id: vine.number().withoutDecimals().positive().optional(),
    category_id: vine.number().withoutDecimals().positive().optional(),

    custom_artist_name: vine.string().minLength(2).maxLength(150).optional(),
    custom_category_name: vine.string().minLength(2).maxLength(150).optional(),

    is_public: vine.boolean().optional(),
  })
)

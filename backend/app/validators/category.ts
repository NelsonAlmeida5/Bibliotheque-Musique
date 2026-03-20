import vine from '@vinejs/vine'

export const createCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(150),
    description: vine.string().maxLength(255).optional(),
  })
)

export const updateCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(150).optional(),
    description: vine.string().maxLength(255).optional(),
  })
)

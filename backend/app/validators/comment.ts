import vine from '@vinejs/vine'

export const createCommentValidator = vine.compile(
  vine.object({
    content: vine.string().minLength(1).maxLength(1000),
  })
)

export const updateCommentValidator = vine.compile(
  vine.object({
    content: vine.string().minLength(1).maxLength(1000),
  })
)

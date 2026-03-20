import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    username: vine.string().minLength(3).maxLength(50),
    email: vine.string().email().maxLength(150),
    password: vine.string().minLength(8).maxLength(255),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().maxLength(150),
    password: vine.string().minLength(8).maxLength(255),
  })
)

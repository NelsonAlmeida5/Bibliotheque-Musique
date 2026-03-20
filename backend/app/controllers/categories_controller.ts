import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'

export default class CategoriesController {
  async index({ request }: HttpContext) {
    const search = request.input('search')
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const query = Category.query().orderBy('name', 'asc')

    if (search) {
      query.where((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('description', `%${search}%`)
      })
    }

    return query.paginate(page, limit)
  }

  async show({ params }: HttpContext) {
    const category = await Category.query()
      .where('id', params.id)
      .preload('tracks', (tracksQuery) => {
        tracksQuery.preload('artist').preload('user').orderBy('created_at', 'desc')
      })
      .firstOrFail()

    return category
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.user!

    if (user.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can create categories' })
    }

    const data = request.only(['name', 'description'])

    const category = await Category.create({
      name: data.name,
      description: data.description,
    })

    return response.created(category)
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.user!

    if (user.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can update categories' })
    }

    const category = await Category.findOrFail(params.id)

    const data = request.only(['name', 'description'])

    if (data.name !== undefined) category.name = data.name
    if (data.description !== undefined) category.description = data.description

    await category.save()

    return category
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!

    if (user.role !== 'admin') {
      return response.forbidden({ message: 'Only admins can delete categories' })
    }

    const category = await Category.findOrFail(params.id)
    await category.delete()

    return { message: 'Category deleted successfully' }
  }
}

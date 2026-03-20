import type { HttpContext } from '@adonisjs/core/http'
import { favoriteArtistValidator } from '#validators/favorite'
import FavoriteArtist from '#models/favorite_artist'
import Artist from '#models/artist'

export default class FavoriteArtistsController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const favorites = await FavoriteArtist.query()
      .where('user_id', user.id)
      .preload('artist')
      .orderBy('created_at', 'desc')

    return favorites
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { artist_id: artistId } = await request.validateUsing(favoriteArtistValidator)

    await Artist.findOrFail(artistId)

    const existing = await FavoriteArtist.query()
      .where('user_id', user.id)
      .where('artist_id', artistId)
      .first()

    if (existing) {
      return response.conflict({ message: 'Artist already in favorites' })
    }

    const favorite = await FavoriteArtist.create({
      userId: user.id,
      artistId: artistId,
    })

    await favorite.load('artist')

    return response.created(favorite)
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const favorite = await FavoriteArtist.query()
      .where('user_id', user.id)
      .where('artist_id', params.artistId)
      .first()

    if (!favorite) {
      return response.notFound({ message: 'Favorite artist not found' })
    }

    await favorite.delete()

    return {
      message: 'Favorite artist removed successfully',
    }
  }
}

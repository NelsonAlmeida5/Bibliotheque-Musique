import type { HttpContext } from '@adonisjs/core/http'
import { favoriteTrackValidator } from '#validators/favorite'
import FavoriteTrack from '#models/favorite_track'
import Track from '#models/track'

export default class FavoriteTracksController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const favorites = await FavoriteTrack.query()
      .where('user_id', user.id)
      .preload('track', (trackQuery) => {
        trackQuery.preload('artist').preload('category').preload('user')
      })
      .orderBy('created_at', 'desc')

    return favorites
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { track_id: trackId } = await request.validateUsing(favoriteTrackValidator)

    await Track.findOrFail(trackId)

    const existing = await FavoriteTrack.query()
      .where('user_id', user.id)
      .where('track_id', trackId)
      .first()

    if (existing) {
      return response.conflict({ message: 'Track already in favorites' })
    }

    const favorite = await FavoriteTrack.create({
      userId: user.id,
      trackId: trackId,
    })

    await favorite.load('track')

    return response.created(favorite)
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const favorite = await FavoriteTrack.query()
      .where('user_id', user.id)
      .where('track_id', params.trackId)
      .first()

    if (!favorite) {
      return response.notFound({ message: 'Favorite track not found' })
    }

    await favorite.delete()

    return {
      message: 'Favorite track removed successfully',
    }
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import { rateTrackValidator } from '#validators/rating'
import Rating from '#models/rating'
import Track from '#models/track'

export default class RatingsController {
  async show({ params, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const trackId = params.id

    await Track.findOrFail(trackId)

    const rating = await Rating.query().where('user_id', user.id).where('track_id', trackId).first()

    const allRatings = await Rating.query().where('track_id', trackId)

    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, item) => sum + item.rating, 0) / allRatings.length
        : null

    return {
      myRating: rating,
      averageRating,
      ratingsCount: allRatings.length,
    }
  }

  async store({ params, request, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const trackId = params.id

    await Track.findOrFail(trackId)

    const data = await request.validateUsing(rateTrackValidator)

    let rating = await Rating.query().where('user_id', user.id).where('track_id', trackId).first()

    if (rating) {
      rating.rating = data.rating
      await rating.save()
    } else {
      rating = await Rating.create({
        userId: user.id,
        trackId: trackId,
        rating: data.rating,
      })
    }

    return rating
  }
}

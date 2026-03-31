import type { HttpContext } from '@adonisjs/core/http'
import Track from '#models/track'
import Artist from '#models/artist'
import Category from '#models/category'
import { DateTime } from 'luxon'

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function daysSince(dateValue: Date | string | DateTime | null | undefined) {
  if (!dateValue) return 999

  let date: Date

  if (typeof dateValue === 'string') {
    date = new Date(dateValue)
  } else if (dateValue instanceof Date) {
    date = dateValue
  } else {
    date = dateValue.toJSDate()
  }

  if (Number.isNaN(date.getTime())) return 999

  const diffMs = Date.now() - date.getTime()
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24))
}

export default class HomeController {
  async index({}: HttpContext) {
    const publicTracks = await Track.query()
      .where('is_public', true)
      .preload('artist')
      .preload('category')
      .preload('ratings')
      .orderBy('created_at', 'desc')

    const artistCountResult = await Artist.query().count('* as total')
    const categoryCountResult = await Category.query().count('* as total')

    const allRatings = publicTracks.flatMap((track) =>
      track.ratings
        .map((rating) => Number(rating.rating || 0))
        .filter((value) => Number.isFinite(value) && value > 0)
    )

    const globalAverage = average(allRatings)
    const priorWeight = 4

    const highlights = publicTracks
      .map((track) => {
        const ratingValues = track.ratings
          .map((rating) => Number(rating.rating || 0))
          .filter((value) => Number.isFinite(value) && value > 0)

        const ratingsCount = ratingValues.length
        const averageRating = average(ratingValues)

        const weightedRating =
          ratingsCount === 0
            ? globalAverage * 0.75
            : (ratingsCount / (ratingsCount + priorWeight)) * averageRating +
              (priorWeight / (ratingsCount + priorWeight)) * globalAverage

        const ageInDays = daysSince(track.createdAt)
        const recencyBoost = Math.max(0, 1 - ageInDays / 21) * 0.65

        const score = weightedRating + recencyBoost

        return {
          id: track.id,
          title: track.title,
          cover_url: track.coverUrl,
          artist: track.artist
            ? {
                id: track.artist.id,
                name: track.artist.name,
              }
            : null,
          category: track.category
            ? {
                id: track.category.id,
                name: track.category.name,
              }
            : null,
          custom_artist_name: track.customArtistName,
          custom_category_name: track.customCategoryName,
          average_rating: Number(averageRating.toFixed(1)),
          ratings_count: ratingsCount,
          created_at: track.createdAt,
          _score: score,
        }
      })
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score
        if (b.ratings_count !== a.ratings_count) return b.ratings_count - a.ratings_count

        const dateA = a.created_at ? new Date(String(a.created_at)).getTime() : 0
        const dateB = b.created_at ? new Date(String(b.created_at)).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)
      .map(({ _score, ...track }) => track)

    return {
      stats: {
        tracks: publicTracks.length,
        artists: Number(artistCountResult[0]?.$extras.total ?? 0),
        categories: Number(categoryCountResult[0]?.$extras.total ?? 0),
        avg_rating: Number(globalAverage.toFixed(1)),
      },
      highlights,
    }
  }
}

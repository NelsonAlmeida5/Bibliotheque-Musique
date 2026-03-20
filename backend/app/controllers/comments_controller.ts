import type { HttpContext } from '@adonisjs/core/http'
import { createCommentValidator, updateCommentValidator } from '#validators/comment'
import Comment from '#models/comment'
import Track from '#models/track'

export default class CommentsController {
  async index({ params }: HttpContext) {
    const trackId = params.id

    await Track.findOrFail(trackId)

    const comments = await Comment.query()
      .where('track_id', trackId)
      .preload('user')
      .orderBy('created_at', 'desc')

    return comments
  }

  async store({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const trackId = params.id

    await Track.findOrFail(trackId)

    const data = await request.validateUsing(createCommentValidator)

    const comment = await Comment.create({
      content: data.content,
      userId: user.id,
      trackId: trackId,
    })

    await comment.load('user')
    await comment.load('track')

    return response.created(comment)
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const comment = await Comment.findOrFail(params.id)

    if (comment.userId !== user.id && user.role !== 'admin') {
      return response.forbidden({ message: 'You are not allowed to update this comment' })
    }

    const data = await request.validateUsing(updateCommentValidator)

    if (data.content !== undefined) {
      comment.content = data.content
    }

    await comment.save()
    await comment.load('user')
    await comment.load('track')

    return comment
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const comment = await Comment.findOrFail(params.id)

    if (comment.userId !== user.id && user.role !== 'admin') {
      return response.forbidden({ message: 'You are not allowed to delete this comment' })
    }

    await comment.delete()

    return {
      message: 'Comment deleted successfully',
    }
  }
}

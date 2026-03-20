import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import Track from '#models/track'
import FavoriteArtist from '#models/favorite_artist'

export default class Artist extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare imageUrl: string | null

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Track)
  declare tracks: HasMany<typeof Track>

  @hasMany(() => FavoriteArtist)
  declare favoriteArtists: HasMany<typeof FavoriteArtist>
}

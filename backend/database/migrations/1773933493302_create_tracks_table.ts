import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tracks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table.string('title', 150).notNullable()
      table.string('embed_url', 1000).notNullable()
      table.string('cover_url', 1000).nullable()
      table.text('description').nullable()

      table.boolean('is_public').notNullable().defaultTo(true)

      table
        .integer('category_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE')

      table
        .integer('artist_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('artists')
        .onDelete('CASCADE')

      table.string('custom_artist_name', 150).nullable()
      table.string('custom_category_name', 150).nullable()

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

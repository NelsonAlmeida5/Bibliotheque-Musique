<script setup>
const alphabet = [
  'All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]

const artists = [
  {
    id: 1,
    initials: 'AC',
    name: 'Atrium Carceri',
    genres: 'Dark Ambient · Atmospheric',
    description:
      'Swedish dark ambient project known for deeply cinematic and oppressive soundscapes built around immersive world-building.',
    tracks: 24,
    variant: 'sand',
  },
  {
    id: 2,
    initials: 'B',
    name: 'Bauhaus',
    genres: 'Gothic Rock · Post-Punk',
    description:
      'British post-punk pioneers widely credited as one of the founding acts of the gothic rock movement.',
    tracks: 18,
    variant: 'violet',
  },
  {
    id: 3,
    initials: 'C',
    name: 'Coil',
    genres: 'Post-Industrial · Experimental',
    description:
      'Groundbreaking English experimental group whose work ranged from industrial to ambient and ritual electronic sound.',
    tracks: 31,
    variant: 'sand',
  },
  {
    id: 4,
    initials: 'DCD',
    name: 'Dead Can Dance',
    genres: 'Neoclassical · Dark Folk',
    description:
      'Australian-British duo blending neoclassical composition with world music influences and haunting atmospheres.',
    tracks: 22,
    variant: 'blue',
  },
  {
    id: 5,
    initials: 'i',
    name: 'ivri',
    genres: 'Shoegaze · Dream Pop',
    description:
      'Independent shoegaze artist known for lush, layered soundscapes and emotionally charged melodies.',
    tracks: 8,
    variant: 'rose',
  },
  {
    id: 6,
    initials: 'L',
    name: 'Lustmord',
    genres: 'Dark Ambient · Industrial',
    description:
      'Pioneer of dark ambient music, Brian Williams has crafted some of the genre’s most oppressive and iconic works.',
    tracks: 19,
    variant: 'green',
  },
  {
    id: 7,
    initials: 'M',
    name: 'Mortiis',
    genres: 'Dark Ambient · Dungeon Synth',
    description:
      'Norwegian project by Håvard Ellefsen, blending dungeon synth with elaborate dark atmospheres and fantasy textures.',
    tracks: 27,
    variant: 'violet',
  },
  {
    id: 8,
    initials: 'Z',
    name: 'Zola Jesus',
    genres: 'Darkwave · Neoclassical',
    description:
      'American singer-songwriter Nika Roza Danilova creates powerful darkwave and art pop with dramatic vocal presence.',
    tracks: 14,
    variant: 'blue',
  },
]
</script>

<template>
  <section class="artists-page">
    <section class="artists-topbar">
      <div class="container artists-topbar__inner">
        <div class="artists-heading">
          <h1>Artists</h1>
          <p>318 artists</p>
        </div>

        <div class="artists-search-wrap">
          <input
            type="text"
            class="artists-search"
            placeholder="Search an artist..."
          />
        </div>
      </div>
    </section>

    <section class="artists-filters-section">
      <div class="container">
        <div class="artists-alpha-filter">
          <span class="artists-filter-label">Filter</span>

          <div class="artists-alpha-list">
            <button
              v-for="letter in alphabet"
              :key="letter"
              type="button"
              class="artists-alpha-button"
              :class="{ 'is-active': letter === 'All' }"
            >
              {{ letter }}
            </button>
          </div>
        </div>

        <div class="artists-grid">
          <article
            v-for="artist in artists"
            :key="artist.id"
            class="artist-card"
          >
            <div
              class="artist-card__cover"
              :class="`artist-card__cover--${artist.variant}`"
            >
              <div class="artist-card__badge">{{ artist.initials }}</div>
              <button type="button" class="artist-card__favorite">♡</button>
            </div>

            <div class="artist-card__body">
              <h3 class="artist-card__name">{{ artist.name }}</h3>
              <p class="artist-card__genres">{{ artist.genres }}</p>
              <p class="artist-card__description">{{ artist.description }}</p>

              <div class="artist-card__footer">
                <span class="artist-card__tracks">{{ artist.tracks }} tracks</span>

                <RouterLink
                  :to="`/artists/${artist.id}`"
                  class="button button--details button--sm"
                >
                  Details
                </RouterLink>
              </div>
            </div>
          </article>
        </div>

        <div class="artists-pagination">
          <button type="button" class="catalog-page-btn">‹</button>
          <button type="button" class="catalog-page-btn is-active">1</button>
          <button type="button" class="catalog-page-btn">2</button>
          <button type="button" class="catalog-page-btn">3</button>
          <button type="button" class="catalog-page-btn">…</button>
          <button type="button" class="catalog-page-btn">12</button>
          <button type="button" class="catalog-page-btn">›</button>
        </div>
      </div>
    </section>
  </section>
</template>
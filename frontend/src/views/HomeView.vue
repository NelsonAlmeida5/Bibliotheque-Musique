<script setup>
const highlights = [
  {
    id: 1,
    index: '01',
    title: 'Monolith',
    artist: 'Twin Tribes',
    category: 'Darkwave',
    rating: '4.8',
  },
  {
    id: 2,
    index: '02',
    title: 'Ritual',
    artist: 'Twin Tribes',
    category: 'Goth Rock',
    rating: '4.6',
  },
  {
    id: 3,
    index: '03',
    title: 'Kasvetli Kutlama',
    artist: 'She Past Away',
    category: 'Goth Rock',
    rating: '4.9',
  },
  {
    id: 4,
    index: '04',
    title: 'Sudno',
    artist: 'Molchat Doma',
    category: 'Post-Punk',
    rating: '4.7',
  },
  {
  id: 5,
  index: '05',
  title: 'The Crimson Veil',
  artist: 'Bauhaus',
  category: 'Gothic Rock',
  rating: '4.3',
}
]
</script>

<template>
  <section class="home-page">
    <section class="home-hero">
      <div class="container home-hero__inner">
        <div class="home-hero__content">

          <h1 class="home-hero__title">
            Music worth
            <span>remembering.</span>
          </h1>

          <p class="home-hero__text">
            A carefully curated library across all genres — dark, atmospheric,
            emotional, and everything in between.
          </p>

          <div class="home-hero__actions">
            <RouterLink to="/tracks" class="button button--primary">
              Explore catalog
            </RouterLink>

            <RouterLink to="/artists" class="button button--secondary">
              Browse artists
            </RouterLink>
          </div>

          <div class="home-stats">
            <div class="home-stat">
              <strong>4</strong>
              <span>Tracks</span>
            </div>

            <div class="home-stat">
              <strong>3</strong>
              <span>Artists</span>
            </div>

            <div class="home-stat">
              <strong>3</strong>
              <span>Categories</span>
            </div>

            <div class="home-stat">
              <strong>0</strong>
              <span>Ratings</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="home-highlights">
      <div class="container">
        <div class="section-heading">
          <h2>This week’s highlights</h2>
          <RouterLink to="/tracks" class="section-link">
            View full catalog →
          </RouterLink>
        </div>

        <div class="highlight-list">
          <article
            v-for="track in highlights"
            :key="track.id"
            class="highlight-row"
          >
            <div class="highlight-row__index">{{ track.index }}</div>

            <div class="highlight-row__track">
              <div class="highlight-cover"></div>

              <div>
                <h3>{{ track.title }}</h3>
                <p>{{ track.artist }}</p>
              </div>
            </div>

            <div class="highlight-row__category">{{ track.category }}</div>

            <div class="highlight-row__rating">
              <span class="stars">★★★★☆</span>
              <span>{{ track.rating }}</span>
            </div>

            <div class="highlight-row__actions">
              <button class="icon-button" type="button">♡</button>
              <RouterLink :to="`/tracks/${track.id}`" class="button button--details button--sm">
                Details →
              </RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>
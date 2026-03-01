<script setup lang="ts">
/**
 * SkeletonMediaPage — скелетон для MoviePage, BookPage, GamePage
 */
</script>

<template>
  <div class="min-h-screen bg-(--background-body)">

    <div class="border-b border-(--border-color) bg-(--background-card)">
      <div class="max-w-5xl mx-auto px-6 py-4">
        <div class="skeleton-back-button"></div>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-6 py-10">
      <div class="flex flex-col lg:flex-row gap-10">

        <!-- Левая колонка -->
        <div class="w-full lg:w-64 shrink-0 flex flex-col gap-4">
          <div class="skeleton-poster"></div>
          <div class="skeleton-dropdown"></div>

          <div class="skeleton-card-small">
            <div class="skeleton-label mb-3"></div>
            <div class="flex gap-1">
              <div
                v-for="i in 5"
                :key="`star-${i}`"
                class="skeleton-star"
              ></div>
            </div>
          </div>

          <div class="skeleton-card-small space-y-3">
            <div
              v-for="i in 4"
              :key="`meta-${i}`"
              class="flex items-start gap-3"
            >
              <div class="skeleton-icon-small"></div>
              <div class="flex-1 space-y-2">
                <div class="skeleton-text skeleton-text--narrow"></div>
                <div class="skeleton-text skeleton-text--medium"></div>
              </div>
            </div>
          </div>

          <div class="skeleton-link-button"></div>
        </div>

        <!-- Правая колонка -->
        <div class="flex-1 min-w-0 flex flex-col gap-6">
          <div>
            <div class="skeleton-page-title mb-3"></div>
            <div class="skeleton-subtitle"></div>
          </div>

          <div class="flex flex-wrap gap-3">
            <div
              v-for="i in 3"
              :key="`tag-${i}`"
              class="skeleton-tag"
            ></div>
          </div>

          <div class="flex flex-wrap gap-6">
            <div
              v-for="i in 2"
              :key="`rating-${i}`"
              class="skeleton-rating-badge"
            ></div>
          </div>

          <div>
            <div class="skeleton-section-heading mb-3"></div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="i in 4"
                :key="`genre-${i}`"
                class="skeleton-chip"
              ></div>
            </div>
          </div>

          <div class="skeleton-card-large">
            <div class="skeleton-section-heading mb-4"></div>
            <div class="space-y-3">
              <div
                v-for="i in 5"
                :key="`desc-${i}`"
                class="skeleton-text-line"
                :style="{ width: i === 5 ? '60%' : '100%' }"
              ></div>
            </div>
          </div>

          <div class="skeleton-card-large">
            <div class="skeleton-section-heading mb-4"></div>
            <div class="space-y-3">
              <div
                v-for="i in 3"
                :key="`additional-${i}`"
                class="skeleton-text-line"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: var(--border-radius-base);
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-back-button {
  @apply skeleton;
  width: 5rem;
  height: 2rem;
}

.skeleton-poster {
  @apply skeleton;
  width: 100%;
  padding-bottom: 150%;
  border-radius: var(--border-radius-xl);
}

.skeleton-dropdown {
  @apply skeleton;
  height: 3rem;
  width: 100%;
  border-radius: var(--border-radius-xl);
}

.skeleton-card-small {
  @apply skeleton;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
}

.skeleton-card-large {
  @apply skeleton;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
}

.skeleton-label {
  @apply skeleton;
  height: 0.75rem;
  width: 6rem;
}

.skeleton-star {
  @apply skeleton;
  width: 1.625rem;
  height: 1.625rem;
  border-radius: var(--border-radius-base);
}

.skeleton-icon-small {
  @apply skeleton;
  width: 1rem;
  height: 1rem;
  border-radius: var(--border-radius-base);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.skeleton-link-button {
  @apply skeleton;
  height: 3rem;
  width: 100%;
  border-radius: var(--border-radius-xl);
}

.skeleton-page-title {
  @apply skeleton;
  height: 2.5rem;
  width: 20rem;
  max-width: 100%;
}

.skeleton-subtitle {
  @apply skeleton;
  height: 1.25rem;
  width: 16rem;
  max-width: 100%;
}

.skeleton-tag {
  @apply skeleton;
  height: 2rem;
  width: 6rem;
  border-radius: var(--border-radius-lg);
}

.skeleton-rating-badge {
  @apply skeleton;
  height: 3rem;
  width: 8rem;
  border-radius: var(--border-radius-xl);
}

.skeleton-section-heading {
  @apply skeleton;
  height: 1.5rem;
  width: 10rem;
}

.skeleton-chip {
  @apply skeleton;
  height: 1.75rem;
  width: 5rem;
  border-radius: var(--border-radius-full);
}

.skeleton-text-line {
  @apply skeleton;
  height: 1rem;
}

.skeleton-text {
  @apply skeleton;
  height: 0.875rem;
}

.skeleton-text--narrow { width: 4rem; }
.skeleton-text--medium { width: 8rem; }
.skeleton-text--wide { width: 12rem; }

@media (max-width: 640px) {
  .skeleton-poster {
    max-width: 12rem;
    margin: 0 auto;
  }

  .skeleton-page-title {
    height: 2rem;
    width: 100%;
  }

  .skeleton-subtitle {
    height: 1rem;
    width: 100%;
  }

  .skeleton-card-small {
    padding: 0.75rem;
  }

  .skeleton-card-large {
    padding: 1rem;
  }

  .skeleton-rating-badge {
    height: 2.5rem;
    width: 7rem;
  }

  .skeleton-star {
    width: 1.375rem;
    height: 1.375rem;
  }
}
</style>

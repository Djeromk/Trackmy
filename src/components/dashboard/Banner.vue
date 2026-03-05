<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function handleLogin() {
  router.push('/login')
}

function handleRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="card-neo mb-8 bg-linear-to-r from-primary-50 to-primary-100">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-(--text-primary) mb-2">
          Добро пожаловать в Media Tracker! 👋
        </h2>
        <p class="text-(--text-primary)">
          Отслеживайте фильмы, сериалы, книги и игры. Создайте аккаунт, чтобы сохранять свой прогресс,
          ставить оценки и делиться списками с друзьями.
        </p>
      </div>
      <div class="flex gap-3 shrink-0">
        <button @click="handleLogin" class="btn-primary px-6 py-3">
          Войти
        </button>
        <button @click="handleRegister" class="btn-secondary px-6 py-3">
          Создать аккаунт
        </button>
      </div>
    </div>
  </div>
</template>

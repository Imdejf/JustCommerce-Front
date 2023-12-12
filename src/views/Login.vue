<script lang="ts" setup>
import Cookies from 'universal-cookie'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref(false)

const handleLogin = () => {
  const formData = new URLSearchParams()
  formData.append('username', username.value)
  formData.append('password', password.value)
  formData.append('grant_type', 'password')
  formData.append('client_id', 'ro.client')
  formData.append('client_secret', 'secret')

  fetch(import.meta.env.VITE_BASE_URL + 'connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  })
    .then(async (response) => {
      const result = await response.json()
      if (result?.error) {
        error.value = true
        console.log(result.error)
      } else {
        cookies.set('Authorization', result.access_token)
        router.push('/')
      }
    })
    .catch((error) => {
      // Obsługa błędu
      console.error(error)
      throw error
    })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="screen">
      <div class="screen__content">
        <div class="mt-[60px] w-[240px]"><img src="../assets/images/logo.png" /></div>
        <div class="login">
          <div class="login__field">
            <input
              type="text"
              v-model="username"
              class="login__input"
              placeholder="User name / Email"
            />
          </div>
          <div class="login__field">
            <input type="password" v-model="password" class="login__input" placeholder="Password" />
          </div>
          <span v-if="error" class="text-xs font-bold">Błędna nazwa użytkownika lub hasło</span>
          <button @click="handleLogin" class="button login__submit">
            <span class="button__text">Log In Now</span>
          </button>
        </div>
      </div>
      <div class="screen__background">
        <span class="screen__background__shape screen__background__shape4"></span>
        <span class="screen__background__shape screen__background__shape3"></span>
        <span class="screen__background__shape screen__background__shape2"></span>
        <span class="screen__background__shape screen__background__shape1"></span>
      </div>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css?family=Raleway:400,700');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: Raleway, sans-serif;
}

body {
  background: rgb(0, 0, 0);
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 1) 0%,
    rgba(118, 67, 13, 1) 50%,
    rgba(0, 0, 0, 1) 100%
  );
}

.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.screen {
  background: linear-gradient(90deg, #f97316, #fdba74);
  position: relative;
  height: 600px;
  width: 360px;
  box-shadow: 0px 0px 24px #f97316;
}

.screen__content {
  z-index: 1;
  position: relative;
  height: 100%;
}

.screen__background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  -webkit-clip-path: inset(0 0 0 0);
  clip-path: inset(0 0 0 0);
}

.screen__background__shape {
  transform: rotate(45deg);
  position: absolute;
}

.screen__background__shape1 {
  height: 520px;
  width: 520px;
  background: #fff;
  top: -50px;
  right: 120px;
  border-radius: 0 72px 0 0;
}

.screen__background__shape2 {
  height: 220px;
  width: 220px;
  background: #ea580c;
  top: -172px;
  right: 0;
  border-radius: 32px;
}

.screen__background__shape3 {
  height: 540px;
  width: 190px;
  background: linear-gradient(270deg, #f97316, #fb923c);
  top: -24px;
  right: 0;
  border-radius: 32px;
}

.screen__background__shape4 {
  height: 400px;
  width: 200px;
  background: #ea580c;
  top: 420px;
  right: 50px;
  border-radius: 60px;
}

.login {
  width: 320px;
  padding: 30px;
}

.login__field {
  padding: 20px 0px;
  position: relative;
}

.login__icon {
  position: absolute;
  top: 30px;
  color: #7875b5;
}

.login__input {
  border: none;
  border-bottom: 2px solid #d1d1d4;
  background: none;
  padding: 10px;
  padding-left: 24px;
  font-weight: 700;
  width: 75%;
  transition: 0.2s;
}

.login__input:active,
.login__input:focus,
.login__input:hover {
  outline: none;
  border-bottom-color: #6a679e;
}

.login__submit {
  background: #fff;
  font-size: 14px;
  margin-top: 30px;
  padding: 16px 20px;
  border-radius: 26px;
  border: 1px solid #d4d3e8;
  text-transform: uppercase;
  font-weight: 700;
  display: flex;
  align-items: center;
  width: 100%;
  color: #ea580c;
  box-shadow: 0px 2px 2px #ea580c;
  cursor: pointer;
  transition: 0.2s;
}

.login__submit:active,
.login__submit:focus,
.login__submit:hover {
  border-color: #6a679e;
  outline: none;
}

.button__icon {
  font-size: 24px;
  margin-left: auto;
  color: #7875b5;
}

.social-login {
  position: absolute;
  height: 140px;
  width: 160px;
  text-align: center;
  bottom: 0px;
  right: 0px;
  color: #fff;
}

.social-icons {
  display: flex;
  align-items: center;
  justify-content: center;
}

.social-login__icon {
  padding: 20px 10px;
  color: #fff;
  text-decoration: none;
  text-shadow: 0px 0px 8px #7875b5;
}

.social-login__icon:hover {
  transform: scale(1.5);
}
</style>

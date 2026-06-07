<template>
  <section id="navbar-logo" class="navbar__logo">
    <slot name="logo"></slot>
  </section>
  <section id="navbar-menu" class="navbar__menu">
    <slot name="menu" />
  </section>
</template>

<style scoped>
.navbar__logo {
  display: none;
}

.navbar__menu {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: visible;
}
</style>

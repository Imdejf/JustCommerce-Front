<template>
  <section id="navbar-logo" class="navbar__logo h-15 border-b border-1 border-orange-500">
    <slot name="logo"></slot>
  </section>
  <section id="navbar-menu" class="navbar__menu mt-5">
    <slot name="menu" />
  </section>
</template>

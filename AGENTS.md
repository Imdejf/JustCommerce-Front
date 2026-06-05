# AGENTS Guidelines for JustCommerce Admin Frontend

This repository contains the Administration frontend of the JustCommerce platform.

This frontend is built using:

* Vue 3
* TypeScript
* Composition API
* Element Plus
* Tailwind CSS

This repository is **not** the Olmag storefront.
The Olmag storefront is a separate Nuxt application.

Do not use Nuxt-specific APIs in this project.

---

# 1. Development Server

During interactive agent work, use the development server only.

Use:

```bash
npm run dev
```

Do not run:

```bash
npm run build
```

The production build should not be executed during agent sessions.

---

# 2. Vue 3 Only

Always use Vue 3 with Composition API.

Preferred:

```vue
<script setup lang="ts">
</script>
```

Do not use:

* Options API
* Nuxt APIs
* Next.js APIs
* React patterns

---

# 3. TypeScript Is Mandatory

Use TypeScript for all new code.

Avoid:

```ts
any
```

Use strongly typed DTOs, interfaces and request models.

---

# 4. API Calls

Do not call API endpoints directly inside components if a service already exists.

Prefer dedicated services such as:

```ts
productService.getProduct(id)
orderService.getOrders(query)
allegroService.getOffer(id)
```

Reuse existing API services and DTOs.

---

# 5. Element Plus

Use Element Plus as the main UI library.

Preferred components:

* ElForm
* ElInput
* ElSelect
* ElDialog
* ElUpload
* ElTable
* ElTabs
* ElDrawer
* ElButton
* ElMessage

Do not introduce another UI framework.

---

# 6. Forms

Use typed reactive forms.

Preferred:

```ts
const form = reactive<ProductForm>({
  name: '',
  price: 0
})
```

Use Element Plus validation rules where possible.

---

# 7. Components

Keep components small and readable.

Extract large sections into child components.

Reuse existing components before creating new ones.

Avoid duplicating logic between pages.

---

# 8. Composables

Reusable logic should be placed in composables.

Examples:

```ts
useProducts()
useOrders()
useAllegro()
```

Do not duplicate the same logic in multiple components.

---

# 9. Styling

Use Tailwind CSS and existing project styling conventions.

Avoid large inline styles.

Keep layouts consistent with the current admin panel.

---

# 10. Allegro Module Rules

The Allegro offer form should keep this section order:

1. Account
2. Category
3. Parameters
4. Delivery and policies
5. Photos and description
6. Validation
7. Preview
8. Publish

Default Allegro values:

* Producer: Olmag
* Condition: NEW
* Stock: 1000
* Shipping time: PT72H
* Publish immediately: true

Reuse existing Allegro DTOs, services and components.

Do not rewrite the Allegro flow from scratch unless explicitly requested.

---

# 11. Uploads

Use the existing upload pattern.

For invoice uploads, files should be converted to Base64 according to backend requirements.

Do not create alternative upload mechanisms if one already exists.

---

# 12. Error Handling

Always handle API errors.

Use user-friendly Element Plus messages.

Example:

```ts
try {
  await productService.saveProduct(form)
  ElMessage.success('Zapisano zmiany')
}
catch (error) {
  ElMessage.error('Nie udało się zapisać zmian')
}
```

Do not silently ignore errors.

---

# 13. Generated Code Rules

When generating code:

* Generate complete files whenever possible.
* Do not omit imports.
* Do not leave TODO placeholders.
* Do not generate pseudocode.
* Preserve existing functionality.
* Do not remove unrelated code.
* Follow the current file structure.

The generated code should compile without additional manual fixes.

---

# 14. Before Writing Code

Always check:

1. Is there already a similar component?
2. Is there already a service for this API?
3. Is there already a DTO for this data?
4. Is this consistent with Vue 3 Composition API?
5. Is this consistent with Element Plus?
6. Does this avoid `npm run build`?

When unsure, follow the existing implementation in this repository.
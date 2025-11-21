# Tailwind

- Avoid constructing class names dynamically at runtime (e.g. `{{ $color }}-600`). Tailwind's compiler will not include these classes.
- Instead, map variants to full class strings or list all required classes explicitly, as done in `resources/views/components/app/confirmation-modal.blade.php`.

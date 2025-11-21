# Marketing Website

The marketing website is built with Livewire and Volt components located under
`resources/views/livewire/website` and `resources/views/components/website`.
It showcases the core features of Omoplata and funnels visitors towards the
registration flow.

## Structure
- **Pages**: Each page is a Livewire component using the layout
  `components.layouts.website`.
- **Components**: Reusable UI pieces such as the hero section, feature lists and
  FAQ accordion live under the `components/website` directory.
- **Configuration**: Texts and feature lists are defined in `config/pages.php`
  which allows easy adjustments without touching the views.

## Content Management
All visible texts use translation keys from `lang/*/website.php`. When adding new
text make sure to provide translations for `en`, `de` and `pt-BR`.
Missing keys were recently added for the `pillars` section and a new
`testimonials` label used on some club pages.

## Development Tips
1. Review the docs in this folder to understand features such as plans,
   memberships and payments. These concepts are highlighted on the marketing
   pages.
2. Run `php artisan test` before committing changes.
3. Keep components focussed and reusable so the website remains easy to extend.

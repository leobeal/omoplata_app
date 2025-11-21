# Sidebar Component

The main and mobile sidebars are implemented as Livewire components located under `resources/views/livewire/app/sections/`. Use `<livewire:app.sections.sidebar>` and `<livewire:app.sections.mobile-sidebar>` directly in the layout.

Both components expose a `logout` method which calls the `App\Livewire\Actions\Logout` action. The logout link in the user menu triggers this method via `wire:click`, ensuring the user session is terminated correctly.

The user dropdown also provides a link to the application's changelog. The `app.changelog` route renders a Volt component that parses `CHANGELOG.md` using `Str::markdown` and displays the formatted entries.

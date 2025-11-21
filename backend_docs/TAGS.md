## Tags

We use [spatie/laravel-tags](https://github.com/spatie/laravel-tags) to attach tags to any Eloquent model.
The package is configured to store tags in each tenant database and the `App\\Models\\Tag` model applies the `UsesTenantConnection` trait.

To make a model taggable add the `Spatie\\Tags\\HasTags` trait. Members (`User` model) already use this trait, allowing tagging like so:

```php
$user->attachTag('vip');
$user->syncTags(['vip', 'newsletter']);
```

Use tags to segment members or categorize other entities as needed.

Users can be searched by tag names since tags are indexed along with other
member attributes. On the members list a maximum of three tags appear next to
each member name; if a member has more tags a "+N" counter indicates the
remaining amount.

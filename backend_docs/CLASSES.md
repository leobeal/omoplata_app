# Classes and Occurrences

Classes define regular training sessions. Each class may specify a default trainer via `trainer_id`.
Occurrences are generated from the class schedule and represent individual sessions.

Each class can also define a **headline** and a **color**. The headline is displayed on the club website timetable below the class name. The color is used for timetable badges and can be selected from a predefined palette when creating or editing a class. The available colors are configured in `config/colors.php`.

## Trainer Overrides

Occurrences now contain an optional `trainer_id` column. When set, this value overrides the trainer defined on the parent class.

Use `effectiveTrainer()` on an `Occurrence` instance to retrieve the trainer that should lead the session.

Classes may optionally set a `max_participants` value. When defined, the portal
prevents members from creating new attendance intentions once the number of
confirmed participants (attendance records and "yes" intentions) reaches this
limit. A friendly "class full" message is shown instead of the usual sign up
buttons.

The admin section now lists daily occurrences under **Classes → Occurrences**.
For upcoming sessions it displays how many spots are filled out of the total
capacity and the members who plan to attend. Past occurrences show the recorded
attendance as well as members who had indicated they would come but were
absent.

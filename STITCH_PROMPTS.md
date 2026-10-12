# Промпты для Google Stitch

Как пользоваться: открой https://stitch.withgoogle.com, выбери **Mobile**, вставь сначала общий стиль, затем промпт экрана (можно одним сообщением). Stitch лучше понимает английский, а тексты на экране в промптах уже на русском.
Когда понравится результат, экспортируй (скриншот или «Copy code» / Figma) и пришли сюда в тред, я перенесу дизайн в приложение.

---

## 0. Общий стиль (добавляй к каждому экрану)

```
Mobile fitness app called "Форма". All UI text in Russian. Dark theme: background #0E0F12, cards #181A1F with 1px border #2A2D35 and 24px rounded corners, primary accent lime #C6F432 with near-black text on accent buttons, secondary colors: blue #6C8CFF (protein), orange #FF9F43 (fat), pink #FF6B9A (carbs). Bold modern sans-serif (Inter or similar), large heavy headlines, generous spacing, pill-shaped primary buttons, outline icons. Minimal, energetic, premium, like Nike Training Club meets Apple Fitness. Bottom tab bar with 4 tabs: Главная, Тренировки, Питание, Профиль.
```

## 1. Приветствие

```
Welcome / splash screen. Lime rounded-square logo with a barbell icon, big title "Форма", subtitle "Личный план тренировок и питания. Ответь на несколько вопросов, и мы посчитаем калории и составим программу на неделю." Three feature rows with lime icons: "Норма калорий под твою цель", "Программа на неделю с подходами", "Прогноз, когда дойдёшь до цели". Full-width lime button at the bottom "Начать". Optional: subtle dark athletic photo or abstract gradient in the background.
```

## 2. Анкета (шаги регистрации)

```
Onboarding questionnaire step screen. Top: back button and a thin lime progress bar with "2/7". Large title "Какая у тебя цель?" and grey hint "От цели зависят калории и программа тренировок". Three large selectable cards with icon, title and hint: "Сбросить вес" (flame), "Набрать мышцы" (barbell), "Быть в форме" (heart); the selected card has a lime border and lime check. Lime button "Дальше" pinned at the bottom.
Also generate variants of the same layout for: name inputs ("Имя", "Фамилия"), sex selection (two big cards "Мужской" / "Женский") with age input, height + current weight + target weight inputs with units "см"/"кг", activity level list (Сидячий, Лёгкий, Средний, Высокий, Очень высокий), and workouts per week selector (2–6) with a row of weekday circles Пн–Вс highlighting training days.
```

## 3. Итог анкеты

```
Onboarding summary screen. Title "Кирилл, всё готово". Big lime card "НОРМА В ДЕНЬ 2150 ккал" with "Дефицит 500 ккал от расхода 2650". Card with macros in three columns: "176 г Белки" (blue), "79 г Жиры" (orange), "184 г Углеводы" (pink). Card "ПРОГНОЗ ≈ 22 недели до 78 кг, темп около 0.46 кг в неделю". Card "ТРЕНИРОВКИ · 3 В НЕДЕЛЮ" with rows: lime circle "Пн" + "Всё тело A", "Ср" + "Всё тело B", "Пт" + "Всё тело C". Bottom lime button "Поехали!".
```

## 4. Главная

```
Home dashboard. Small grey date "Вторник, 6 октября", big title "Привет, Кирилл". Card with a circular calorie ring (lime) showing "1760 осталось", next to it "Калории сегодня 390 / 2150 ккал", "Б 176 · Ж 79 · У 184 г" and lime link "Добавить еду ›". Card "ТРЕНИРОВКА СЕГОДНЯ": "Всё тело A", "Ноги, грудь, спина · 6 упражнений", lime progress bar, "Сделано 6 из 19 подходов". Card "НЕДЕЛЯ" with 7 small progress rings for Пн–Вс (completed days show a lime check), and "18 из 53 подходов за неделю". Card "ЦЕЛЬ · СБРОСИТЬ ВЕС" with "88 кг → 78 кг" (target in lime) and "Примерно 22 недели". Bottom tab bar, Главная active.
```

## 5. Тренировки

```
Weekly workout plan screen. Title "Тренировки", subtitle "План на неделю · 3 дня в зале". Card "ПРОГРЕСС НЕДЕЛИ 11%" with lime progress bar. Row of 7 day chips Пн Вт Ср Чт Пт Сб Вс, the selected day filled lime, training days marked with a small dot. Section "Понедельник · сегодня", title "Всё тело A", subtitle "Ноги, грудь, спина". List of exercise cards: number badge, exercise name ("Приседания со штангой", "Жим штанги лёжа", "Тяга верхнего блока", "Жим гантелей сидя", "Планка"), "4 × 12" under it, and a row of tappable pill-shaped set buttons each labelled with reps ("12"); completed sets are filled lime, a fully completed exercise card gets a lime border and a check badge. Footer hint "Нажми на подход, когда сделаешь его. Отдых 60–90 сек". Bottom tab bar, Тренировки active.
```

## 6. Питание

```
Nutrition / calorie tracker screen. Title "Питание". Card with a large lime calorie ring "390 из 2150 ккал" and three stats under it: "2651 Расход", "1928 Обмен (BMR)", "1760 Осталось" (lime). Card "ЦЕЛЬ ПО БЖУ НА ДЕНЬ" with protein/fat/carbs in blue/orange/pink. Card "ДОБАВИТЬ" with inputs "Что съел" and "Калории (ккал)", lime button "+ Добавить", and a horizontal scroll of quick-add food chips ("Овсянка 60 г · 225 ккал", "Яйца, 2 шт · 155 ккал", "Куриная грудка 150 г · 165 ккал"). Card "СЪЕДЕНО СЕГОДНЯ" with rows: time, food name, kcal, small remove icon. Bottom tab bar, Питание active.
```

## 7. Профиль

```
Profile screen. Title "Кирилл", subtitle "Профиль". Card "ЦЕЛЬ: Сбросить вес" with a 3×2 stats grid: "182 см Рост", "88 кг Вес", "78 кг Цель" (lime), "19 Возраст", "26.6 ИМТ", "3/нед Тренировок". Card "КАК СЧИТАЮТСЯ КАЛОРИИ" with a short explanation. Card "ЗАПИСАТЬ ВЕС" with an input "кг", lime button "Сохранить", and a small weight history list (date + kg), optionally a mini line chart of weight. Secondary button "Изменить данные и цель" and red outline button "Сбросить всё". Bottom tab bar, Профиль active.
```

## 8. Карточка упражнения (техника)

```
Exercise technique detail screen, opens full-screen when you tap an exercise. Big title "Жим штанги лёжа" with a round close button (X) on the right. Large 3:2 photo with 24px rounded corners showing a person doing a bench press, with a small lime pill badge in the bottom-left corner "▶ начало → конец движения". Row of two outline pills: "4 × 12" with a repeat icon and "отдых 60–90 сек" with a timer icon. Card "РАБОТАЮТ МЫШЦЫ": "Основные: грудные мышцы" (label in lime), "Помогают: трицепс, передние дельты" (label in gray). Card "КАК ВЫПОЛНЯТЬ" with 5 numbered steps, each number in a small lime circle. Card "ЧАСТЫЕ ОШИБКИ" with 3 rows, each with a red X-circle icon: "Штанга отбивается от груди", "Таз отрывается от скамьи", "Локти разведены строго в стороны". Tip card with a lime border and a light-bulb icon: "С большим весом жми только со страхующим". Full-width secondary pill button with a YouTube icon "Видео с техникой на YouTube". Tiny gray caption at the bottom "Фото: Free Exercise DB".
```

## 9. Калории по фото

```
Two states of a "photo calorie counter" card on the nutrition screen. State 1: card with a lime circle camera icon, title "Калории по фото", subtitle "Сфоткай тарелку, и ИИ оценит калории и БЖУ", and two buttons side by side: lime "Камера" and dark "Галерея". State 2 (result): the same card shows the food photo with rounded corners, a big title "Гречка с курицей и салатом", a small dark pill "средняя точность" and "Б 52 · Ж 14 · У 51 г", a list of detected items with grams and kcal on the right ("Гречка отварная · 200 г · 220 ккал", "Куриная грудка · 150 г · 248 ккал", "Салат с маслом · 120 г · 95 ккал"), a short italic note in gray, an editable input "Калории (можно поправить) 563 ккал", a full-width lime button "+ Добавить в дневник" and a gray text button "Отмена". Also show a loading state with a spinner and text "Считаю калории… обычно 10–30 секунд".
```

## 10. Выбор дней тренировок

```
Card "В КАКИЕ ДНИ ХОДИШЬ В ЗАЛ?" with a row of 7 equal rounded-square toggle buttons Пн Вт Ср Чт Пт Сб Вс; selected days (Пн, Ср, Пт) are filled lime with dark text, others are dark with a thin border. Under the row a gray hint "3 тренировки в неделю". Two pill buttons at the bottom: dark "Отмена" and lime "Сохранить". Also design the same day picker as a step of the onboarding questionnaire with the title "В какие дни будешь ходить в зал?" and hint "Новичкам лучше 3 дня с отдыхом между ними".
```

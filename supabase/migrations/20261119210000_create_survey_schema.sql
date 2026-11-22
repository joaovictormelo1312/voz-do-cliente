create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug uuid not null unique default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  category text not null default '' check (char_length(category) <= 100),
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create index surveys_owner_id_idx on public.surveys (owner_id);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 1000),
  kind text not null check (kind in ('rating', 'single_choice', 'text')),
  required boolean not null default true,
  position integer not null check (position >= 0),
  unique (id, survey_id),
  unique (survey_id, position)
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 500),
  position integer not null check (position >= 0),
  unique (id, question_id),
  unique (question_id, position)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  unique (id, survey_id)
);

create index submissions_survey_id_submitted_at_idx on public.submissions (survey_id, submitted_at);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null,
  submission_id uuid not null,
  question_id uuid not null,
  rating integer check (rating between 1 and 5),
  text_value text check (char_length(btrim(text_value)) between 1 and 4000),
  option_id uuid,
  check (num_nonnulls(rating, text_value, option_id) = 1),
  foreign key (submission_id, survey_id) references public.submissions (id, survey_id) on delete cascade,
  foreign key (question_id, survey_id) references public.questions (id, survey_id),
  foreign key (option_id, question_id) references public.question_options (id, question_id),
  unique (submission_id, question_id)
);

create index answers_question_id_idx on public.answers (question_id);

alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.submissions enable row level security;
alter table public.answers enable row level security;

revoke all on public.surveys, public.questions, public.question_options, public.submissions, public.answers from public, anon, authenticated;
grant select, insert, update, delete on public.surveys, public.questions, public.question_options to authenticated;
grant select on public.submissions, public.answers to authenticated;

create policy surveys_owner on public.surveys
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy questions_owner on public.questions
  for all to authenticated
  using (exists (
    select 1 from public.surveys
    where surveys.id = questions.survey_id and surveys.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.surveys
    where surveys.id = questions.survey_id and surveys.owner_id = (select auth.uid())
  ));

create policy question_options_owner on public.question_options
  for all to authenticated
  using (exists (
    select 1 from public.questions
    join public.surveys on surveys.id = questions.survey_id
    where questions.id = question_options.question_id and surveys.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.questions
    join public.surveys on surveys.id = questions.survey_id
    where questions.id = question_options.question_id and surveys.owner_id = (select auth.uid())
  ));

create policy submissions_owner_read on public.submissions
  for select to authenticated
  using (exists (
    select 1 from public.surveys
    where surveys.id = submissions.survey_id and surveys.owner_id = (select auth.uid())
  ));

create policy answers_owner_read on public.answers
  for select to authenticated
  using (exists (
    select 1 from public.surveys
    where surveys.id = answers.survey_id and surveys.owner_id = (select auth.uid())
  ));

alter table public.surveys add column standard_form boolean not null default false;

create function public.guard_standard_survey()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'UPDATE' and new.standard_form is distinct from old.standard_form then
    raise exception using errcode = 'P0001', message = 'STANDARD_FORM_LOCKED';
  end if;
  if tg_op = 'INSERT' and new.standard_form and new.status <> 'draft' then
    raise exception using errcode = 'P0001', message = 'STANDARD_FORM_LOCKED';
  end if;
  if tg_op = 'UPDATE' and new.standard_form and new.status = 'active' and (
    select count(*) from public.questions q
    where q.survey_id = new.id and (
      (q.position = 0 and q.kind = 'rating' and q.required)
      or (q.position = 1 and q.kind = 'text' and not q.required)
    )
  ) <> 2 then
    raise exception using errcode = 'P0001', message = 'STANDARD_FORM_INCOMPLETE';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_standard_survey() from public, anon, authenticated;
create trigger guard_standard_survey before insert or update on public.surveys
  for each row execute function public.guard_standard_survey();

create function public.guard_standard_questions()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  old_standard boolean := false;
  new_standard boolean := false;
begin
  if tg_op <> 'INSERT' then
    select s.standard_form into old_standard from public.surveys s where s.id = old.survey_id;
  end if;
  if tg_op <> 'DELETE' then
    select s.standard_form into new_standard from public.surveys s where s.id = new.survey_id;
  end if;
  if tg_op = 'DELETE' then
    if old_standard then raise exception using errcode = 'P0001', message = 'STANDARD_FORM_LOCKED'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and (old_standard or new_standard) and (
    new.id is distinct from old.id or new.survey_id is distinct from old.survey_id or new.kind is distinct from old.kind
    or new.position is distinct from old.position or new.required is distinct from old.required
  ) then
    raise exception using errcode = 'P0001', message = 'STANDARD_FORM_LOCKED';
  end if;
  if new_standard and not (
    (new.position = 0 and new.kind = 'rating' and new.required)
    or (new.position = 1 and new.kind = 'text' and not new.required)
  ) then
    raise exception using errcode = 'P0001', message = 'STANDARD_FORM_LOCKED';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_standard_questions() from public, anon, authenticated;
create trigger guard_standard_questions before insert or update or delete on public.questions
  for each row execute function public.guard_standard_questions();

create function public.guard_standard_options()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op <> 'INSERT' and exists (
    select 1 from public.questions q join public.surveys s on s.id = q.survey_id
    where q.id = old.question_id and s.standard_form
  ) then
    raise exception using errcode = 'P0001', message = 'STANDARD_FORM_LOCKED';
  end if;
  if tg_op <> 'DELETE' and exists (
    select 1 from public.questions q join public.surveys s on s.id = q.survey_id
    where q.id = new.question_id and s.standard_form
  ) then
    raise exception using errcode = 'P0001', message = 'STANDARD_FORM_LOCKED';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_standard_options() from public, anon, authenticated;
create trigger guard_standard_options before insert or update or delete on public.question_options
  for each row execute function public.guard_standard_options();

create function public.create_standard_survey(
  p_title text, p_description text, p_category text, p_status text,
  p_starts_at timestamptz, p_ends_at timestamptz,
  p_rating_title text, p_comment_title text
)
returns public.surveys
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  result public.surveys;
begin
  insert into public.surveys (owner_id, title, description, category, status, starts_at, ends_at, standard_form)
  values (auth.uid(), p_title, p_description, p_category, 'draft', p_starts_at, p_ends_at, true)
  returning * into result;
  insert into public.questions (survey_id, title, kind, required, position) values
    (result.id, p_rating_title, 'rating', true, 0),
    (result.id, p_comment_title, 'text', false, 1);
  if p_status <> 'draft' then
    update public.surveys set status = p_status where id = result.id returning * into result;
  end if;
  return result;
end;
$$;
revoke all on function public.create_standard_survey(text, text, text, text, timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.create_standard_survey(text, text, text, text, timestamptz, timestamptz, text, text) to authenticated;

create or replace function public.get_public_survey(p_slug uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object('survey', case when result.survey is null then null
    else result.survey || jsonb_build_object('standard_form', s.standard_form) end)
  from (select public.get_public_survey_internal(p_slug) as survey) result
  left join public.surveys s on s.slug = p_slug;
$$;

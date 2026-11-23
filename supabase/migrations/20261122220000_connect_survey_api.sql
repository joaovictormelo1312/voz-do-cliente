-- Operações públicas expõem apenas a pesquisa disponível e gravam respostas
-- em uma única transação, sem conceder acesso direto às tabelas.
alter table public.answers alter constraint answers_question_id_survey_id_fkey deferrable initially deferred;
alter table public.answers alter constraint answers_option_id_question_id_fkey deferrable initially deferred;

create function public.get_public_survey(p_slug uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'id', s.id, 'slug', s.slug, 'title', s.title,
    'description', s.description, 'status', s.status,
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', q.id, 'title', q.title, 'kind', q.kind,
          'required', q.required, 'position', q.position,
          'options', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', o.id, 'label', o.label, 'position', o.position
            ) order by o.position)
            from public.question_options o where o.question_id = q.id
          ), '[]'::jsonb)
        ) order by q.position
      ) from public.questions q where q.survey_id = s.id
    ), '[]'::jsonb)
  )
  from public.surveys s
  where s.slug = p_slug and s.status = 'active'
    and (s.starts_at is null or s.starts_at <= now())
    and (s.ends_at is null or s.ends_at >= now());
$$;

create function public.submit_public_survey(p_survey_id uuid, p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  survey public.surveys%rowtype;
  question public.questions%rowtype;
  item jsonb;
  question_id uuid;
  option_id uuid;
  submission_id uuid;
  seen uuid[] := '{}';
begin
  select * into survey from public.surveys
    where id = p_survey_id for share;
  if not found or survey.status <> 'active'
     or (survey.starts_at is not null and survey.starts_at > now())
     or (survey.ends_at is not null and survey.ends_at < now()) then
    raise exception using errcode = 'P0001', message = 'SURVEY_UNAVAILABLE';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
  end if;
  if jsonb_array_length(p_answers) not between 1 and 200 then
    raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
  end if;

  insert into public.submissions (survey_id) values (survey.id)
    returning id into submission_id;
  for item in select value from jsonb_array_elements(p_answers) loop
    if jsonb_typeof(item) <> 'object'
       or coalesce(item->>'question_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
    end if;
    question_id := (item->>'question_id')::uuid;
    if question_id = any(seen) then
      raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
    end if;
    seen := array_append(seen, question_id);
    select * into question from public.questions q
      where q.id = question_id and q.survey_id = survey.id;
    if not found then
      raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
    end if;

    if question.kind = 'rating' then
      if jsonb_typeof(item->'rating') is distinct from 'number'
         or coalesce(item->>'rating', '') !~ '^[1-5]$'
         or (item - 'question_id' - 'rating') <> '{}'::jsonb then
        raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
      end if;
      insert into public.answers (survey_id, submission_id, question_id, rating)
        values (survey.id, submission_id, question_id, (item->>'rating')::integer);
    elsif question.kind = 'text' then
      if jsonb_typeof(item->'text_value') is distinct from 'string'
         or char_length(btrim(item->>'text_value')) not between 1 and 4000
         or (item - 'question_id' - 'text_value') <> '{}'::jsonb then
        raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
      end if;
      insert into public.answers (survey_id, submission_id, question_id, text_value)
        values (survey.id, submission_id, question_id, item->>'text_value');
    else
      if jsonb_typeof(item->'option_id') is distinct from 'string'
         or coalesce(item->>'option_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         or (item - 'question_id' - 'option_id') <> '{}'::jsonb then
        raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
      end if;
      option_id := (item->>'option_id')::uuid;
      if not exists (select 1 from public.question_options o where o.id = option_id and o.question_id = question.id) then
        raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
      end if;
      insert into public.answers (survey_id, submission_id, question_id, option_id)
        values (survey.id, submission_id, question_id, option_id);
    end if;
  end loop;

  if exists (select 1 from public.questions q where q.survey_id = survey.id and q.required and not (q.id = any(seen))) then
    raise exception using errcode = 'P0001', message = 'INVALID_ANSWERS';
  end if;
  return submission_id;
end;
$$;

revoke all on function public.get_public_survey(uuid) from public;
revoke all on function public.submit_public_survey(uuid, jsonb) from public;
grant execute on function public.get_public_survey(uuid) to anon, authenticated;
grant execute on function public.submit_public_survey(uuid, jsonb) to anon, authenticated;

-- A criação da pergunta e das opções deve ser atômica e respeitar RLS.
create function public.create_question_with_options(
  p_survey_id uuid, p_title text, p_kind text, p_required boolean,
  p_position integer, p_options jsonb
)
returns public.questions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  question public.questions%rowtype;
  option_item jsonb;
begin
  if p_kind = 'single_choice' and
    (p_options is null or jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) < 2) then
    raise exception using errcode = 'P0001', message = 'INVALID_OPTIONS';
  end if;
  insert into public.questions (survey_id, title, kind, required, position)
    values (p_survey_id, p_title, p_kind, p_required, p_position)
    returning * into question;
  if p_kind = 'single_choice' then
    for option_item in select value from jsonb_array_elements(p_options) loop
      insert into public.question_options (question_id, label, position)
        values (question.id, option_item->>'label', (option_item->>'position')::integer);
    end loop;
  end if;
  return question;
end;
$$;

revoke all on function public.create_question_with_options(uuid, text, text, boolean, integer, jsonb) from public, anon;
grant execute on function public.create_question_with_options(uuid, text, text, boolean, integer, jsonb) to authenticated;

-- Não alterar perguntas/opções após o primeiro envio; serializa alterações com
-- o bloqueio da pesquisa feito pelo envio público.
create function public.lock_answered_survey_structure()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  old_survey uuid;
  new_survey uuid;
  v_survey_id uuid;
begin
  if tg_table_name = 'questions' then
    if tg_op <> 'INSERT' then old_survey := old.survey_id; end if;
    if tg_op <> 'DELETE' then new_survey := new.survey_id; end if;
  else
    if tg_op <> 'INSERT' then
      select q.survey_id into old_survey from public.questions q where q.id = old.question_id;
    end if;
    if tg_op <> 'DELETE' then
      select q.survey_id into new_survey from public.questions q where q.id = new.question_id;
    end if;
  end if;
  for v_survey_id in
    select distinct id from unnest(array[old_survey, new_survey]) id
      where id is not null order by id
  loop
    perform 1 from public.surveys s where s.id = v_survey_id for update;
    if found and exists (select 1 from public.submissions s where s.survey_id = v_survey_id) then
      raise exception using errcode = 'P0001', message = 'SURVEY_HAS_RESPONSES';
    end if;
  end loop;
  if tg_table_name = 'questions' and tg_op = 'INSERT'
     and (select count(*) from public.questions q where q.survey_id = new_survey) >= 200 then
    raise exception using errcode = 'P0001', message = 'QUESTION_LIMIT_REACHED';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.lock_answered_survey_structure() from public, anon, authenticated;
create trigger lock_answered_questions before insert or update or delete on public.questions
  for each row execute function public.lock_answered_survey_structure();
create trigger lock_answered_options before insert or update or delete on public.question_options
  for each row execute function public.lock_answered_survey_structure();

create table public.survey_request_limits (
  survey_id uuid not null references public.surveys(id) on delete cascade,
  request_kind text not null check (request_kind in ('read', 'submit')),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (survey_id, request_kind)
);

alter table public.survey_request_limits enable row level security;
revoke all on public.survey_request_limits from public, anon, authenticated;

create function public.check_survey_request_limit(p_survey_id uuid, p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  current_attempts integer;
begin
  insert into public.survey_request_limits as l (survey_id, request_kind, window_started_at, attempts)
  values (p_survey_id, p_kind, v_now, 1)
  on conflict (survey_id, request_kind) do update
    set window_started_at = case
          when l.window_started_at <= v_now - interval '1 minute' then v_now
          else l.window_started_at
        end,
        attempts = case
          when l.window_started_at <= v_now - interval '1 minute' then 1
          else least(l.attempts + 1, p_limit + 1)
        end
  returning attempts into current_attempts;
  return current_attempts <= p_limit;
end;
$$;
revoke all on function public.check_survey_request_limit(uuid, text, integer) from public, anon, authenticated;

alter function public.get_public_survey(uuid) rename to get_public_survey_internal;
revoke all on function public.get_public_survey_internal(uuid) from public, anon, authenticated;

create function public.get_public_survey(p_slug uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_survey_id uuid;
begin
  select s.id into v_survey_id from public.surveys s where s.slug = p_slug;
  if not found then
    return jsonb_build_object('survey', null);
  end if;
  if not public.check_survey_request_limit(v_survey_id, 'read', 300) then
    return jsonb_build_object('error', 'RATE_LIMITED');
  end if;
  return jsonb_build_object('survey', public.get_public_survey_internal(p_slug));
end;
$$;
revoke all on function public.get_public_survey(uuid) from public;
grant execute on function public.get_public_survey(uuid) to anon, authenticated;

alter function public.submit_public_survey(uuid, jsonb) rename to submit_public_survey_limited;
revoke all on function public.submit_public_survey_limited(uuid, jsonb) from public, anon, authenticated;

create function public.submit_public_survey(p_survey_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  submission_id uuid;
begin
  if not exists (select 1 from public.surveys s where s.id = p_survey_id) then
    return jsonb_build_object('error', 'SURVEY_UNAVAILABLE');
  end if;
  if not public.check_survey_request_limit(p_survey_id, 'submit', 120) then
    return jsonb_build_object('error', 'RATE_LIMITED');
  end if;

  begin
    submission_id := public.submit_public_survey_limited(p_survey_id, p_answers);
  exception when raise_exception then
    if sqlerrm in ('SURVEY_UNAVAILABLE', 'INVALID_ANSWERS', 'RATE_LIMITED') then
      return jsonb_build_object('error', sqlerrm);
    end if;
    raise;
  end;
  return jsonb_build_object('submission_id', submission_id);
end;
$$;
revoke all on function public.submit_public_survey(uuid, jsonb) from public;
grant execute on function public.submit_public_survey(uuid, jsonb) to anon, authenticated;

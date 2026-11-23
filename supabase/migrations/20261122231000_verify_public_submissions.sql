-- Somente o servidor, após validar o desafio, pode registrar respostas.
revoke all on function public.submit_public_survey(uuid, jsonb) from public, anon, authenticated;

create table public.used_survey_challenges (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null
);
create index used_survey_challenges_expires_at_idx on public.used_survey_challenges(expires_at);
alter table public.used_survey_challenges enable row level security;
revoke all on public.used_survey_challenges from public, anon, authenticated;

create function public.submit_verified_survey(p_survey_id uuid, p_answers jsonb, p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  submission_id uuid;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVALID_CHALLENGE_HASH';
  end if;

  delete from public.used_survey_challenges
  where token_hash in (
    select token_hash from public.used_survey_challenges
    where expires_at < clock_timestamp()
    order by expires_at limit 100 for update skip locked
  );
  insert into public.used_survey_challenges (token_hash, expires_at)
  values (p_token_hash, clock_timestamp() + interval '10 minutes')
  on conflict do nothing;
  if not found then
    return jsonb_build_object('error', 'CHALLENGE_REUSED');
  end if;

  begin
    submission_id := public.submit_public_survey_internal(p_survey_id, p_answers);
  exception when raise_exception then
    if sqlerrm in ('SURVEY_UNAVAILABLE', 'INVALID_ANSWERS') then
      return jsonb_build_object('error', sqlerrm);
    end if;
    raise;
  end;
  return jsonb_build_object('submission_id', submission_id);
end;
$$;
revoke all on function public.submit_verified_survey(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_verified_survey(uuid, jsonb, text) to service_role;

-- Leituras não compartilham mais uma cota que um visitante poderia esgotar.
create or replace function public.get_public_survey(p_slug uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object('survey', public.get_public_survey_internal(p_slug));
$$;

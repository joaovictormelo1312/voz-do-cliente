-- Mantém a validação e a gravação originais em uma função interna.
alter function public.submit_public_survey(uuid, jsonb) rename to submit_public_survey_internal;
revoke all on function public.submit_public_survey_internal(uuid, jsonb) from public, anon, authenticated;

create function public.submit_public_survey(p_survey_id uuid, p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recent_count integer;
begin
  -- Serializa os envios da mesma pesquisa antes de verificar a janela.
  perform 1 from public.surveys s where s.id = p_survey_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'SURVEY_UNAVAILABLE';
  end if;

  select count(*) into recent_count
  from public.submissions s
  where s.survey_id = p_survey_id
    and s.submitted_at > clock_timestamp() - interval '1 minute';

  if recent_count >= 60 then
    raise exception using errcode = 'P0001', message = 'RATE_LIMITED';
  end if;
  return public.submit_public_survey_internal(p_survey_id, p_answers);
end;
$$;

revoke all on function public.submit_public_survey(uuid, jsonb) from public;
grant execute on function public.submit_public_survey(uuid, jsonb) to anon, authenticated;

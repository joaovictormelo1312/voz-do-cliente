-- Uma transação pode aguardar o bloqueio da pesquisa; registre a hora efetiva
-- do envio, não a hora em que a transação começou.
alter table public.submissions alter column submitted_at set default clock_timestamp();

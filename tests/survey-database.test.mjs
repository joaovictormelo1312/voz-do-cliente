import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("migrações garantem isolamento, envio público atômico e proteção das respostas", async () => {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
    `);
    for (const migration of ["20261119210000_create_survey_schema.sql", "20261122220000_connect_survey_api.sql", "20261122223000_limit_public_submissions.sql", "20261122224000_submission_timestamp.sql", "20261122230000_guard_public_requests.sql"]) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${migration}`, import.meta.url), "utf8"));
    }
    await db.query("insert into auth.users (id) values ($1), ($2)", [owner, other]);
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    const survey = (await db.query("insert into public.surveys (owner_id, title, status) values ($1, 'Pesquisa', 'active') returning *", [owner])).rows[0];
    const anotherSurvey = (await db.query("insert into public.surveys (owner_id, title, status) values ($1, 'Outra pesquisa', 'active') returning *", [owner])).rows[0];
    const rating = (await db.query("select * from public.create_question_with_options($1, 'Nota', 'rating', true, 0, '[]'::jsonb)", [survey.id])).rows[0];
    const choice = (await db.query("select * from public.create_question_with_options($1, 'Escolha', 'single_choice', true, 1, $2::jsonb)", [survey.id, JSON.stringify([{ label: "Sim", position: 0 }, { label: "Não", position: 1 }])])).rows[0];
    const option = (await db.query("select id from public.question_options where question_id = $1 order by position limit 1", [choice.id])).rows[0];
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [other]);
    assert.equal((await db.query("select * from public.surveys where id = $1", [survey.id])).rows.length, 0);
    assert.equal((await db.query("select * from public.questions where survey_id = $1", [survey.id])).rows.length, 0);
    await assert.rejects(db.query("select public.get_public_survey_internal($1)", [survey.slug]), /permission denied/);
    await assert.rejects(db.query("select public.submit_public_survey_limited($1, '[]'::jsonb)", [survey.id]), /permission denied/);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select * from public.surveys"), /permission denied/);
    await assert.rejects(db.query("insert into public.submissions (survey_id) values ($1)", [survey.id]), /permission denied/);
    await assert.rejects(db.query("select public.submit_public_survey_internal($1, '[]'::jsonb)", [survey.id]), /permission denied/);
    await assert.rejects(db.query("select public.submit_public_survey_limited($1, '[]'::jsonb)", [survey.id]), /permission denied/);
    await assert.rejects(db.query("select public.get_public_survey_internal($1)", [survey.slug]), /permission denied/);
    await assert.rejects(db.query("select public.check_survey_request_limit($1, 'read', 9999)", [survey.id]), /permission denied/);
    await assert.rejects(db.query("select * from public.survey_request_limits"), /permission denied/);
    const publicSurvey = (await db.query("select public.get_public_survey($1) as result", [survey.slug])).rows[0].result.survey;
    assert.equal(publicSurvey.questions.length, 2);
    assert.equal("owner_id" in publicSurvey, false);
    const validRating = { question_id: rating.id, rating: 5 };
    const validChoice = { question_id: choice.id, option_id: option.id };
    for (const answers of [
      [validRating],
      [validRating, validRating, validChoice],
      [validRating, { ...validChoice, option_id: crypto.randomUUID() }],
      [{ ...validRating, text_value: "extra" }, validChoice],
      [validRating, { ...validChoice, question_id: crypto.randomUUID() }],
      [validRating, { ...validChoice, option_id: "inválido" }],
    ]) {
      const result = await db.query("select public.submit_public_survey($1, $2::jsonb) as result", [survey.id, JSON.stringify(answers)]);
      assert.equal(result.rows[0].result.error, "INVALID_ANSWERS");
    }
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    assert.equal((await db.query("select * from public.submissions")).rows.length, 0);
    await db.exec("reset role; set role anon");
    await db.exec("begin");
    await db.query("select pg_sleep(0.05)");
    const first = await db.query("select public.submit_public_survey($1, $2::jsonb) as result", [survey.id, JSON.stringify([validRating, validChoice])]);
    assert.ok(first.rows[0].result.submission_id);
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [owner]);
    assert.equal((await db.query("select submitted_at > transaction_timestamp() as recorded_after_start from public.submissions")).rows[0].recorded_after_start, true);
    await db.exec("commit");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [other]);
    assert.equal((await db.query("select * from public.submissions")).rows.length, 0);
    assert.equal((await db.query("select * from public.answers")).rows.length, 0);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    assert.equal((await db.query("select * from public.submissions")).rows.length, 1);
    assert.equal((await db.query("select * from public.answers")).rows.length, 2);
    await assert.rejects(db.query("update public.questions set title = 'Alterada' where id = $1", [rating.id]), /SURVEY_HAS_RESPONSES/);
    await assert.rejects(db.query("delete from public.questions where id = $1", [rating.id]), /SURVEY_HAS_RESPONSES/);
    await assert.rejects(db.query("insert into public.questions (survey_id, title, kind, position) values ($1, 'Nova', 'text', 2)", [survey.id]), /SURVEY_HAS_RESPONSES/);
    await db.exec("reset role; set role anon");
    const validAnswers = JSON.stringify([validRating, validChoice]);
    for (let i = 0; i < 59; i++) {
      const result = await db.query("select public.submit_public_survey($1, $2::jsonb) as result", [survey.id, validAnswers]);
      assert.ok(result.rows[0].result.submission_id);
    }
    assert.equal((await db.query("select public.submit_public_survey($1, $2::jsonb) as result", [survey.id, validAnswers])).rows[0].result.error, "RATE_LIMITED");
    for (let i = 0; i < 53; i++) {
      await db.query("select public.submit_public_survey($1, '[]'::jsonb)", [survey.id]);
    }
    await db.exec("reset role");
    await db.query("update public.submissions set submitted_at = now() - interval '2 minutes' where survey_id = $1", [survey.id]);
    await db.exec("set role anon");
    assert.equal((await db.query("select public.submit_public_survey($1, $2::jsonb) as result", [survey.id, validAnswers])).rows[0].result.error, "RATE_LIMITED");
    for (let i = 0; i < 299; i++) {
      assert.ok((await db.query("select public.get_public_survey($1) as result", [survey.slug])).rows[0].result.survey);
    }
    assert.equal((await db.query("select public.get_public_survey($1) as result", [survey.slug])).rows[0].result.error, "RATE_LIMITED");
    assert.ok((await db.query("select public.get_public_survey($1) as result", [anotherSurvey.slug])).rows[0].result.survey);
    assert.notEqual((await db.query("select public.submit_public_survey($1, '[]'::jsonb) as result", [anotherSurvey.id])).rows[0].result.error, "RATE_LIMITED");
    const unknown = crypto.randomUUID();
    assert.equal((await db.query("select public.get_public_survey($1) as result", [unknown])).rows[0].result.survey, null);
    assert.equal((await db.query("select public.submit_public_survey($1, '[]'::jsonb) as result", [unknown])).rows[0].result.error, "SURVEY_UNAVAILABLE");
    await db.exec("reset role");
    assert.equal((await db.query("select count(*)::int as count from public.survey_request_limits where survey_id = $1", [unknown])).rows[0].count, 0);
    await db.query("update public.survey_request_limits set window_started_at = now() - interval '2 minutes' where survey_id = $1", [survey.id]);
    await db.exec("set role anon");
    assert.ok((await db.query("select public.get_public_survey($1) as result", [survey.slug])).rows[0].result.survey);
    assert.ok((await db.query("select public.submit_public_survey($1, $2::jsonb) as result", [survey.id, validAnswers])).rows[0].result.submission_id);
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    await db.query("update public.surveys set status = 'closed' where id = $1", [survey.id]);
    await db.exec("reset role; set role anon");
    assert.equal((await db.query("select public.get_public_survey($1) as result", [survey.slug])).rows[0].result.survey, null);
    assert.equal((await db.query("select public.submit_public_survey($1, $2::jsonb) as result", [survey.id, validAnswers])).rows[0].result.error, "SURVEY_UNAVAILABLE");
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    await db.query("update public.surveys set status = 'active' where id = $1", [survey.id]);
    await db.exec("reset role");
    await db.exec(await readFile(new URL("../supabase/migrations/20261122231000_verify_public_submissions.sql", import.meta.url), "utf8"));
    await db.exec("set role anon");
    await assert.rejects(db.query("select public.submit_public_survey($1, $2::jsonb)", [survey.id, validAnswers]), /permission denied/);
    await assert.rejects(db.query("select public.submit_verified_survey($1, $2::jsonb, $3)", [survey.id, validAnswers, "a".repeat(64)]), /permission denied/);
    for (let i = 0; i < 301; i++) {
      assert.ok((await db.query("select public.get_public_survey($1) as result", [survey.slug])).rows[0].result.survey);
    }
    await db.exec("reset role; set role authenticated");
    await assert.rejects(db.query("select public.submit_public_survey($1, $2::jsonb)", [survey.id, validAnswers]), /permission denied/);
    await assert.rejects(db.query("select public.submit_verified_survey($1, $2::jsonb, $3)", [survey.id, validAnswers, "a".repeat(64)]), /permission denied/);
    await db.exec("reset role; set role service_role");
    for (let i = 0; i < 121; i++) {
      const hash = i.toString(16).padStart(64, "0");
      const result = await db.query("select public.submit_verified_survey($1, $2::jsonb, $3) as result", [survey.id, validAnswers, hash]);
      assert.ok(result.rows[0].result.submission_id);
    }
    const repeated = await db.query("select public.submit_verified_survey($1, $2::jsonb, $3) as result", [survey.id, validAnswers, "0".repeat(64)]);
    assert.equal(repeated.rows[0].result.error, "CHALLENGE_REUSED");
    await assert.rejects(db.query("select public.submit_verified_survey($1, $2::jsonb, 'invalid')", [survey.id, validAnswers]), /INVALID_CHALLENGE_HASH/);
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    await db.query("delete from public.surveys where id = $1", [survey.id]);
    assert.equal((await db.query("select * from public.answers")).rows.length, 0);

    await db.exec("reset role");
    await db.exec(await readFile(new URL("../supabase/migrations/20261123000000_standard_survey_form.sql", import.meta.url), "utf8"));
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    const createStandard = "select * from public.create_standard_survey($1, '', 'Teste', 'draft', null, null, $2, $3)";
    await assert.rejects(db.query(createStandard, ["Inválida", "Nota", ""]), /check constraint/);
    assert.equal((await db.query("select count(*)::int as count from public.surveys where title = 'Inválida'")).rows[0].count, 0);
    const standard = (await db.query(createStandard, ["Pesquisa padrão", "Qual sua nota?", "Como melhorar?"])).rows[0];
    assert.equal(standard.standard_form, true);
    const questions = (await db.query("select * from public.questions where survey_id = $1 order by position", [standard.id])).rows;
    assert.deepEqual(questions.map((q) => [q.kind, q.required]), [["rating", true], ["text", false]]);
    await db.query("update public.questions set title = 'Como avalia?' where id = $1", [questions[0].id]);
    await assert.rejects(db.query("update public.questions set kind = 'text' where id = $1", [questions[0].id]), /STANDARD_FORM_LOCKED/);
    await assert.rejects(db.query("delete from public.questions where id = $1", [questions[0].id]), /STANDARD_FORM_LOCKED/);
    await assert.rejects(db.query("insert into public.questions (survey_id, title, kind, required, position) values ($1, 'Extra', 'text', false, 2)", [standard.id]), /STANDARD_FORM_LOCKED/);
    await assert.rejects(db.query("insert into public.question_options (question_id, label, position) values ($1, 'Extra', 0)", [questions[0].id]), /STANDARD_FORM_LOCKED/);
    await assert.rejects(db.query("update public.surveys set standard_form = false where id = $1", [standard.id]), /STANDARD_FORM_LOCKED/);
    const incomplete = (await db.query("insert into public.surveys (owner_id, title, standard_form) values ($1, 'Incompleta', true) returning id", [owner])).rows[0];
    await assert.rejects(db.query("update public.surveys set status = 'active' where id = $1", [incomplete.id]), /STANDARD_FORM_INCOMPLETE/);
    await db.query("delete from public.surveys where id = $1", [incomplete.id]);
    await db.query("update public.surveys set status = 'active' where id = $1", [standard.id]);
    await db.exec("reset role; set role anon");
    assert.equal((await db.query("select public.get_public_survey($1) as result", [standard.slug])).rows[0].result.survey.standard_form, true);
    await db.exec("reset role; set role service_role");
    const commentOnly = JSON.stringify([{ question_id: questions[1].id, text_value: "Comentário" }]);
    assert.equal((await db.query("select public.submit_verified_survey($1, $2::jsonb, $3) as result", [standard.id, commentOnly, "e".repeat(64)])).rows[0].result.error, "INVALID_ANSWERS");
    const ratingOnly = JSON.stringify([{ question_id: questions[0].id, rating: 5 }]);
    assert.ok((await db.query("select public.submit_verified_survey($1, $2::jsonb, $3) as result", [standard.id, ratingOnly, "f".repeat(64)])).rows[0].result.submission_id);
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    await assert.rejects(db.query("update public.questions set title = 'Alterada' where id = $1", [questions[0].id]), /SURVEY_HAS_RESPONSES/);
    const version = (await db.query(createStandard, ["Pesquisa padrão - nova versão", "Como avalia?", "Como melhorar?"])).rows[0];
    assert.notEqual(version.id, standard.id);
    assert.equal((await db.query("select count(*)::int as count from public.submissions where survey_id = $1", [standard.id])).rows[0].count, 1);
    assert.equal((await db.query("select count(*)::int as count from public.submissions where survey_id = $1", [version.id])).rows[0].count, 0);
    await db.query("delete from public.surveys where id in ($1, $2)", [standard.id, version.id]);
  } finally {
    await db.close();
  }
});

-- =============================================================================
-- 課程報名改用 SECURITY DEFINER RPC
-- 日期：2026-05-31
-- 問題：
--   前台報名是以訪客(anon)直接 INSERT registrations + UPDATE courses，
--   但這兩張表 RLS 僅允許 authenticated（管理員），導致 anon 報名被擋（錯誤碼 42501）。
-- 解法：
--   建立 SECURITY DEFINER 函式，讓訪客「只能透過此受控函式」完成報名與人數累加，
--   不需對 registrations / courses 開放直接寫入權限（比加 anon 寫入 policy 更安全）。
--
-- 執行方式：貼到 Supabase → SQL Editor → Run。
-- =============================================================================

create or replace function submit_course_registration(
  p_course_id   uuid,
  p_parent_name text,
  p_phone       text,
  p_email       text default null,
  p_child_age   int  default null,
  p_note        text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id       uuid;
  v_enrolled int;
  v_capacity int;
begin
  -- 基本必填驗證（後端再把關一次）
  if p_parent_name is null or btrim(p_parent_name) = ''
     or p_phone is null or btrim(p_phone) = '' then
    raise exception '家長姓名與聯絡電話為必填';
  end if;

  insert into registrations (course_id, parent_name, phone, email, child_age, note, status)
  values (p_course_id, p_parent_name, p_phone, p_email, p_child_age, p_note, 'confirmed')
  returning id into v_id;

  -- 累加課程報名人數並更新狀態（達上限改 full）
  select enrolled, capacity into v_enrolled, v_capacity
  from courses where id = p_course_id;

  if found then
    update courses
       set enrolled = coalesce(v_enrolled, 0) + 1,
           status = case
                      when coalesce(v_enrolled, 0) + 1 >= coalesce(v_capacity, 2147483647)
                      then 'full' else 'open'
                    end
     where id = p_course_id;
  end if;

  return v_id;
end;
$$;

-- 只開放「執行這個函式」，不等於開放整張表的寫入
revoke all on function submit_course_registration(uuid, text, text, text, int, text) from public;
grant execute on function submit_course_registration(uuid, text, text, text, int, text) to anon, authenticated;

-- 驗證（可單獨跑）：應看到 anon、authenticated 具 EXECUTE
-- select grantee, privilege_type from information_schema.role_routine_grants
--   where routine_name = 'submit_course_registration';

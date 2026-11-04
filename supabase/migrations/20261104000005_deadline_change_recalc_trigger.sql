-- 20261104000005_deadline_change_recalc_trigger.sql
-- Automatic Reminder Recomputation on Scholarship Deadline Update (P6-T6)

CREATE OR REPLACE FUNCTION public.handle_scholarship_deadline_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_app RECORD;
  v_day INTEGER;
  v_remind_time TIMESTAMPTZ;
BEGIN
  -- If deadline or verification status hasn't changed, do nothing
  IF OLD.student_deadline_at IS NOT DISTINCT FROM NEW.student_deadline_at AND
     OLD.is_deadline_verified IS NOT DISTINCT FROM NEW.is_deadline_verified THEN
    RETURN NEW;
  END IF;

  -- Delete undismissed future reminders for this scholarship
  DELETE FROM public.reminders
  WHERE scholarship_id = NEW.id AND is_dismissed = FALSE AND remind_at > NOW();

  -- If new deadline is verified and in the future, recompute for active applications
  IF NEW.student_deadline_at IS NOT NULL AND NEW.is_deadline_verified IS TRUE AND NEW.student_deadline_at > NOW() THEN
    FOR v_app IN (
      SELECT a.id AS application_id, a.user_id, coalesce(p.reminder_days_before, ARRAY[30, 14, 7, 3, 1]) AS reminder_days
      FROM public.applications a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.scholarship_id = NEW.id AND a.status NOT IN ('Awarded', 'Not selected', 'Closed')
    ) LOOP
      FOREACH v_day IN ARRAY v_app.reminder_days LOOP
        v_remind_time := NEW.student_deadline_at - (v_day || ' days')::INTERVAL;
        IF v_remind_time > NOW() THEN
          INSERT INTO public.reminders (
            user_id,
            application_id,
            scholarship_id,
            remind_at,
            reminder_label,
            is_dismissed
          ) VALUES (
            v_app.user_id,
            v_app.application_id,
            NEW.id,
            v_remind_time,
            'Deadline in ' || v_day || ' days',
            FALSE
          );
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scholarship_deadline_update ON public.scholarships;
CREATE TRIGGER trg_scholarship_deadline_update
AFTER UPDATE OF student_deadline_at, is_deadline_verified ON public.scholarships
FOR EACH ROW
EXECUTE FUNCTION public.handle_scholarship_deadline_update();

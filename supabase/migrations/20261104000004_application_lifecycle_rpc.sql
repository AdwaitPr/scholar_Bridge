-- 20261104000004_application_lifecycle_rpc.sql
-- Atomic Application & Checklist Initialization RPC (P6-T3)

CREATE OR REPLACE FUNCTION public.initialize_application_with_checklist(
  p_user_id UUID,
  p_scholarship_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_app_id UUID;
  v_checklist_id UUID;
  v_status public.application_status;
  v_student_deadline TIMESTAMPTZ;
  v_is_deadline_verified BOOLEAN;
  v_reminder_days INTEGER[];
  v_day INTEGER;
  v_remind_time TIMESTAMPTZ;
  v_doc RECORD;
  v_sort_order SMALLINT := 3;
  v_inserted_items INTEGER := 0;
BEGIN
  -- 1. Ensure Application Exists (Idempotent)
  SELECT id, status INTO v_app_id, v_status
  FROM public.applications
  WHERE user_id = p_user_id AND scholarship_id = p_scholarship_id;

  IF v_app_id IS NULL THEN
    INSERT INTO public.applications (user_id, scholarship_id, status)
    VALUES (p_user_id, p_scholarship_id, 'Saved')
    RETURNING id, status INTO v_app_id, v_status;
  END IF;

  -- 2. Ensure Application Checklist Exists
  SELECT id INTO v_checklist_id
  FROM public.application_checklists
  WHERE application_id = v_app_id;

  IF v_checklist_id IS NULL THEN
    INSERT INTO public.application_checklists (application_id, user_id)
    VALUES (v_app_id, p_user_id)
    RETURNING id INTO v_checklist_id;
  END IF;

  -- 3. Seed Standard Preparation Tasks (Idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM public.checklist_items 
    WHERE checklist_id = v_checklist_id AND item_title = 'Verify One Time Registration (OTR) on NSP Portal'
  ) THEN
    INSERT INTO public.checklist_items (checklist_id, user_id, item_title, item_category, guidance_notes, is_completed, sort_order)
    VALUES (
      v_checklist_id,
      p_user_id,
      'Verify One Time Registration (OTR) on NSP Portal',
      'registration',
      'Generate or authenticate your 14-digit OTR number using Aadhaar/Face-RD on scholarships.gov.in before applying.',
      FALSE,
      1
    );
    v_inserted_items := v_inserted_items + 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.checklist_items 
    WHERE checklist_id = v_checklist_id AND item_title = 'Confirm Aadhaar-Seeded DBT Bank Account'
  ) THEN
    INSERT INTO public.checklist_items (checklist_id, user_id, item_title, item_category, guidance_notes, is_completed, sort_order)
    VALUES (
      v_checklist_id,
      p_user_id,
      'Confirm Aadhaar-Seeded DBT Bank Account',
      'verification',
      'Verify on NPCI / UIDAI mapper that your bank account is active for Direct Benefit Transfer (DBT). Joint or closed accounts will result in disbursement failure.',
      FALSE,
      2
    );
    v_inserted_items := v_inserted_items + 1;
  END IF;

  -- 4. Seed Scholarship-Specific Document Tasks
  FOR v_doc IN (
    SELECT document_name, specification_notes, is_mandatory, issuing_authority, sort_order
    FROM public.scholarship_documents
    WHERE scholarship_id = p_scholarship_id
    ORDER BY sort_order ASC
  ) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.checklist_items 
      WHERE checklist_id = v_checklist_id AND item_title = v_doc.document_name
    ) THEN
      INSERT INTO public.checklist_items (
        checklist_id,
        user_id,
        item_title,
        item_category,
        guidance_notes,
        is_completed,
        sort_order
      ) VALUES (
        v_checklist_id,
        p_user_id,
        v_doc.document_name,
        'document',
        coalesce(v_doc.specification_notes, '') || CASE WHEN v_doc.issuing_authority IS NOT NULL THEN ' [Authority: ' || v_doc.issuing_authority || ']' ELSE '' END,
        FALSE,
        v_sort_order
      );
      v_sort_order := v_sort_order + 1;
      v_inserted_items := v_inserted_items + 1;
    END IF;
  END LOOP;

  -- 5. Seed Final Verification Request Task
  IF NOT EXISTS (
    SELECT 1 FROM public.checklist_items 
    WHERE checklist_id = v_checklist_id AND item_title = 'Submit for Institute Nodal Officer (INO) Verification'
  ) THEN
    INSERT INTO public.checklist_items (checklist_id, user_id, item_title, item_category, guidance_notes, is_completed, sort_order)
    VALUES (
      v_checklist_id,
      p_user_id,
      'Submit for Institute Nodal Officer (INO) Verification',
      'verification',
      'Inform your institute nodal officer once the online application is submitted so institute verification is completed before the INO deadline.',
      FALSE,
      99
    );
    v_inserted_items := v_inserted_items + 1;
  END IF;

  -- 6. Schedule Deadline Reminders (P6-T6)
  SELECT student_deadline_at, is_deadline_verified
  INTO v_student_deadline, v_is_deadline_verified
  FROM public.scholarships
  WHERE id = p_scholarship_id;

  IF v_student_deadline IS NOT NULL AND v_is_deadline_verified IS TRUE AND v_student_deadline > NOW() THEN
    SELECT reminder_days_before INTO v_reminder_days
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_reminder_days IS NULL THEN
      v_reminder_days := ARRAY[30, 14, 7, 3, 1];
    END IF;

    FOREACH v_day IN ARRAY v_reminder_days LOOP
      v_remind_time := v_student_deadline - (v_day || ' days')::INTERVAL;
      IF v_remind_time > NOW() THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.reminders
          WHERE user_id = p_user_id 
            AND scholarship_id = p_scholarship_id 
            AND remind_at = v_remind_time
        ) THEN
          INSERT INTO public.reminders (
            user_id,
            application_id,
            scholarship_id,
            remind_at,
            reminder_label,
            is_dismissed
          ) VALUES (
            p_user_id,
            v_app_id,
            p_scholarship_id,
            v_remind_time,
            'Deadline in ' || v_day || ' days',
            FALSE
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'application_id', v_app_id,
    'checklist_id', v_checklist_id,
    'status', v_status,
    'new_items_created', v_inserted_items
  );
END;
$$;

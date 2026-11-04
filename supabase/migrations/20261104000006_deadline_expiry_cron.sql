-- 20261104000006_deadline_expiry_cron.sql
-- Nightly Job: Flag expired scholarships for review (D14)

CREATE OR REPLACE FUNCTION public.flag_expired_scholarships_for_review()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Flag scholarships where student deadline has passed and was previously verified
  UPDATE public.scholarships
  SET 
    verification_status = 'flagged_for_review',
    updated_at = NOW()
  WHERE 
    student_deadline_at < NOW()
    AND verification_status IN ('verified', 'verified_renewal_only');

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- Schedule nightly at 18:30 UTC (00:00 IST) if pg_cron is enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'nightly-flag-expired-scholarships',
      '30 18 * * *', -- 00:00 IST
      'SELECT public.flag_expired_scholarships_for_review();'
    );
  END IF;
END $$;

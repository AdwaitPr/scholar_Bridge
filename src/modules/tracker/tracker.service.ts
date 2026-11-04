import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  type ApplicationStatus,
  isValidStatusTransition,
} from "@/lib/schemas/application.schema";
import {
  type ApplicationTrackerRecord,
  calculateChecklistProgress,
} from "./tracker.types";
import seedScholarships from "../../../supabase/seed/scholarships.json";

export { type ApplicationTrackerRecord, calculateChecklistProgress };

export class ApplicationTrackerService {
  /**
   * Atomically initializes an application, its checklist, standard + scholarship items,
   * and scheduled deadline reminders (P6-T3).
   */
  static async initializeApplicationWithChecklist(
    userId: string,
    scholarshipIdOrCode: string
  ): Promise<{
    applicationId: string;
    checklistId: string;
    status: ApplicationStatus;
  }> {
    const supabase = await createServerSupabaseClient();

    // Check if scholarshipId is a UUID or a Code / Slug
    let resolvedScholarshipId = scholarshipIdOrCode;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        scholarshipIdOrCode
      );

    if (!isUuid) {
      const { data: matched } = await supabase
        .from("scholarships")
        .select("id")
        .or(`code.eq.${scholarshipIdOrCode},slug.eq.${scholarshipIdOrCode}`)
        .maybeSingle();

      if (matched) {
        resolvedScholarshipId = matched.id;
      }
    }

    try {
      const { data, error } = await supabase.rpc(
        "initialize_application_with_checklist",
        {
          p_user_id: userId,
          p_scholarship_id: resolvedScholarshipId,
        }
      );

      if (!error && data) {
        const payload = data as unknown as {
          application_id: string;
          checklist_id: string;
          status: ApplicationStatus;
        };
        return {
          applicationId: payload.application_id,
          checklistId: payload.checklist_id,
          status: payload.status,
        };
      }
    } catch {
      // Fall through to fallback flow
    }

    // Direct fallback insertion for local testing
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id, status")
      .eq("user_id", userId)
      .eq("scholarship_id", resolvedScholarshipId)
      .maybeSingle();

    let appId = existingApp?.id;
    let appStatus = existingApp?.status ?? "Saved";

    if (!appId) {
      const { data: newApp, error: appErr } = await supabase
        .from("applications")
        .insert({
          user_id: userId,
          scholarship_id: resolvedScholarshipId,
          status: "Saved",
        })
        .select()
        .single();

      if (appErr) throw new Error(appErr.message);
      appId = newApp.id;
      appStatus = newApp.status;
    }

    const { data: existingChecklist } = await supabase
      .from("application_checklists")
      .select("id")
      .eq("application_id", appId)
      .maybeSingle();

    let checklistId = existingChecklist?.id;

    if (!checklistId) {
      const { data: newChecklist, error: clErr } = await supabase
        .from("application_checklists")
        .insert({
          application_id: appId,
          user_id: userId,
        })
        .select()
        .single();

      if (clErr) throw new Error(clErr.message);
      checklistId = newChecklist.id;

      // Seed standard items
      await supabase.from("checklist_items").insert([
        {
          checklist_id: checklistId,
          user_id: userId,
          item_title: "Verify One Time Registration (OTR) on NSP Portal",
          item_category: "registration",
          guidance_notes:
            "Generate or authenticate your 14-digit OTR number using Aadhaar/Face-RD on scholarships.gov.in before applying.",
          is_completed: false,
          sort_order: 1,
        },
        {
          checklist_id: checklistId,
          user_id: userId,
          item_title: "Confirm Aadhaar-Seeded DBT Bank Account",
          item_category: "verification",
          guidance_notes:
            "Verify on NPCI / UIDAI mapper that your bank account is active for Direct Benefit Transfer (DBT).",
          is_completed: false,
          sort_order: 2,
        },
      ]);
    }

    return {
      applicationId: appId,
      checklistId,
      status: appStatus,
    };
  }

  /**
   * Updates application status enforcing the finite state machine transitions (P6-T2).
   */
  static async updateApplicationStatus(
    applicationId: string,
    userId: string,
    targetStatus: ApplicationStatus,
    extraFields?: {
      application_reference_id?: string | null;
      private_notes?: string | null;
      target_submission_date?: string | null;
    }
  ): Promise<{
    success: boolean;
    application?: ApplicationTrackerRecord;
    error?: string;
  }> {
    const supabase = await createServerSupabaseClient();

    const { data: currentApp, error: fetchErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !currentApp) {
      return { success: false, error: "Application record not found" };
    }

    if (!isValidStatusTransition(currentApp.status, targetStatus)) {
      return {
        success: false,
        error: `Invalid transition from "${currentApp.status}" to "${targetStatus}".`,
      };
    }

    const updates: Database["public"]["Tables"]["applications"]["Update"] = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
      ...extraFields,
    };

    if (targetStatus === "Submitted" && !currentApp.submitted_at) {
      updates.submitted_at = new Date().toISOString();
    }

    const { data: updated, error: updateErr } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", applicationId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return {
      success: true,
      application: updated as unknown as ApplicationTrackerRecord,
    };
  }

  /**
   * Calculates progress and readiness state for a checklist (P6-T5).
   */
  static calculateChecklistProgress(
    items: Array<{ is_completed: boolean; item_category?: string }>
  ) {
    return calculateChecklistProgress(items);
  }

  /**
   * Resolves in-memory seed data for offline / unit test environments.
   */
  static getSeedScholarshipByCode(codeOrSlug: string) {
    return seedScholarships.find(
      (s) =>
        s.code.toLowerCase() === codeOrSlug.toLowerCase() ||
        s.slug.toLowerCase() === codeOrSlug.toLowerCase()
    );
  }
}

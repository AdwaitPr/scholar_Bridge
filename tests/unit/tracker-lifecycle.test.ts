import { describe, it, expect } from "vitest";
import {
  isValidStatusTransition,
  type ApplicationStatus,
} from "@/lib/schemas/application.schema";
import { ApplicationTrackerService } from "@/modules/tracker/tracker.service";

describe("Phase 6: Application Lifecycle State Machine & Tracker Progress (P6-T2, P6-T5)", () => {
  describe("Finite State Machine Transitions", () => {
    it("allows valid forward preparation transitions", () => {
      expect(isValidStatusTransition("Saved", "Researching")).toBe(true);
      expect(isValidStatusTransition("Researching", "Preparing")).toBe(true);
      expect(isValidStatusTransition("Preparing", "Ready to apply")).toBe(true);
      expect(isValidStatusTransition("Ready to apply", "Submitted")).toBe(true);
      expect(isValidStatusTransition("Submitted", "Awaiting result")).toBe(
        true
      );
      expect(isValidStatusTransition("Awaiting result", "Awarded")).toBe(true);
      expect(isValidStatusTransition("Awaiting result", "Not selected")).toBe(
        true
      );
    });

    it("allows transitioning to Closed from ANY status", () => {
      const allStatuses: ApplicationStatus[] = [
        "Saved",
        "Researching",
        "Preparing",
        "Ready to apply",
        "Submitted",
        "Awaiting result",
        "Awarded",
        "Not selected",
        "Closed",
      ];

      for (const status of allStatuses) {
        expect(isValidStatusTransition(status, "Closed")).toBe(true);
      }
    });

    it("allows restarting from Closed into early preparation stages", () => {
      expect(isValidStatusTransition("Closed", "Saved")).toBe(true);
      expect(isValidStatusTransition("Closed", "Researching")).toBe(true);
      expect(isValidStatusTransition("Closed", "Preparing")).toBe(true);
      // But NOT jumping directly from Closed to Submitted or Awarded
      expect(isValidStatusTransition("Closed", "Submitted")).toBe(false);
      expect(isValidStatusTransition("Closed", "Awarded")).toBe(false);
    });

    it("allows valid backward adjustments in preparation", () => {
      expect(isValidStatusTransition("Researching", "Saved")).toBe(true);
      expect(isValidStatusTransition("Preparing", "Researching")).toBe(true);
      expect(isValidStatusTransition("Ready to apply", "Preparing")).toBe(true);
    });

    it("strictly rejects illegal state skips", () => {
      // Cannot skip directly from Saved to Submitted
      expect(isValidStatusTransition("Saved", "Submitted")).toBe(false);
      // Cannot jump from Saved to Awarded
      expect(isValidStatusTransition("Saved", "Awarded")).toBe(false);
      // Cannot reverse a Submitted application back to Ready to apply
      expect(isValidStatusTransition("Submitted", "Ready to apply")).toBe(
        false
      );
      // Cannot jump from Awarded back to Preparing
      expect(isValidStatusTransition("Awarded", "Preparing")).toBe(false);
    });
  });

  describe("Checklist Progress & Readiness State Calculation", () => {
    it("handles empty items gracefully", () => {
      const progress = ApplicationTrackerService.calculateChecklistProgress([]);
      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.percentage).toBe(0);
      expect(progress.readinessState).toBe("Not started");
    });

    it("marks readiness state as 'Not started' when 0 items are completed", () => {
      const items = [
        { is_completed: false },
        { is_completed: false },
        { is_completed: false },
      ];
      const progress =
        ApplicationTrackerService.calculateChecklistProgress(items);
      expect(progress.percentage).toBe(0);
      expect(progress.readinessState).toBe("Not started");
    });

    it("marks readiness state as 'In progress' with correct percentage", () => {
      const items = [
        { is_completed: true },
        { is_completed: true },
        { is_completed: false },
        { is_completed: false },
      ];
      const progress =
        ApplicationTrackerService.calculateChecklistProgress(items);
      expect(progress.total).toBe(4);
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBe(50);
      expect(progress.readinessState).toBe("In progress");
    });

    it("marks readiness state as 'Ready to submit' when 100% of items are completed", () => {
      const items = [
        { is_completed: true },
        { is_completed: true },
        { is_completed: true },
      ];
      const progress =
        ApplicationTrackerService.calculateChecklistProgress(items);
      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(3);
      expect(progress.percentage).toBe(100);
      expect(progress.readinessState).toBe("Ready to submit");
    });
  });
});
